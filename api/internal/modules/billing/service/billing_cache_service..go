package billingservice

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-redis/redis/v8"
	"golang.org/x/net/html"
)

type OpenExchangeResponse struct {
	Disclaimer string             `json:"disclaimer"`
	License    string             `json:"license"`
	Timestamp  int64              `json:"timestamp"`
	Base       string             `json:"base"`
	Rates      map[string]float64 `json:"rates"`
}

func (bs *BillingService) GetLatestRates(ctx context.Context) (map[string]float64, error) {
	cachedRates, err := bs.cache.Billing.GetRates(ctx)
	if err == nil {
		log.Println("CACHE HIT: Getting 'latest_rates' from Redis.")
		return cachedRates, nil
	}

	if !errors.Is(err, redis.Nil) {
		log.Printf("Redis error getting 'latest_rates': %v. Falling back to API.", err)
	}

	log.Println("CACHE MISS: Getting 'latest_rates' from the API.")
	apiRates, err := bs.fetchLatestRatesFromAPI(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from API: %w", err)
	}

	bcvRate, err := bs.fetchBCVRate(ctx)
	if err != nil {
		log.Printf("Could not fetch BCV rate, will use the one from provider. Error: %v", err)
	} else {
		apiRates["VES"] = bcvRate
	}

	go func() {
		log.Println("CACHE SET: Saving 'latest_rates' to Redis in the background.")
		err := bs.cache.Billing.SetRates(context.Background(), apiRates)
		if err != nil {
			log.Printf("Error caching 'latest_rates': %v", err)
		}
	}()

	return apiRates, nil
}

func (bs *BillingService) GetHistoricalRateForCurrency(ctx context.Context, date, currency string) (float64, error) {

	keyName := fmt.Sprintf("%s:%s", date, currency)
	cachedRate, err := bs.cache.Billing.GetSpecificTimeRateForCurrency(ctx, date, currency)
	if err == nil {
		log.Printf("CACHE HIT: Getting 'rate:%s' from Redis.", keyName)
		return cachedRate, nil
	}

	if !errors.Is(err, redis.Nil) {
		log.Printf("Redis error getting 'rate:%s': %v. Falling back to API.", keyName, err)
	}

	log.Printf("CACHE MISS: Getting 'rate:%s' from the API.", keyName)
	apiRate, err := bs.fetchHistoricalRateFromAPI(ctx, date, currency)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch from API: %w", err)
	}

	go func() {
		log.Printf("CACHE SET: Saving 'rate:%s' to Redis (expires in 3 min).", keyName)
		err := bs.cache.Billing.SetSpecificTimeRateForCurrency(context.Background(), date, currency, apiRate)
		if err != nil {
			log.Printf("Error caching 'rate:%s': %v", keyName, err)
		}
	}()

	return apiRate, nil
}

func (bs *BillingService) fetchLatestRatesFromAPI(ctx context.Context) (map[string]float64, error) {
	appID := bs.cfg.OpenExchange.AppID
	if appID == "" {
		return nil, errors.New("OpenExchange AppID is not configured")
	}

	url := fmt.Sprintf("https://openexchangerates.org/api/latest.json?app_id=%s", appID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := bs.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned a non-OK status: %s", resp.Status)
	}

	var apiResponse OpenExchangeResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, err
	}

	return apiResponse.Rates, nil
}

func (bs *BillingService) fetchBCVRate(ctx context.Context) (float64, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://www.bcv.org.ve/", nil)
	if err != nil {
		return 0, fmt.Errorf("error creating request to BCV: %w", err)
	}

	resp, err := bs.http.Do(req)
	if err != nil {
		return 0, fmt.Errorf("error performing request to BCV: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("BCV website returned a non-OK status: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("error reading BCV response body: %w", err)
	}

	doc, err := html.Parse(strings.NewReader(string(body)))
	if err != nil {
		return 0, fmt.Errorf("error parsing BCV HTML: %w", err)
	}

	var findDolarValue func(*html.Node) (string, bool)
	findDolarValue = func(n *html.Node) (string, bool) {
		if n.Type == html.ElementNode && n.Data == "div" {
			for _, a := range n.Attr {
				if a.Key == "id" && a.Val == "dolar" {
					var findStrong func(*html.Node) (string, bool)
					findStrong = func(node *html.Node) (string, bool) {
						if node.Type == html.ElementNode && node.Data == "strong" {
							return node.FirstChild.Data, true
						}
						for c := node.FirstChild; c != nil; c = c.NextSibling {
							if val, ok := findStrong(c); ok {
								return val, true
							}
						}
						return "", false
					}
					return findStrong(n)
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			if val, ok := findDolarValue(c); ok {
				return val, true
			}
		}
		return "", false
	}

	if value, ok := findDolarValue(doc); ok {
		cleanedValue := strings.Replace(strings.TrimSpace(value), ",", ".", 1)
		return strconv.ParseFloat(cleanedValue, 64)
	}

	return 0, errors.New("could not find 'dolar' div in BCV HTML")
}

func (bs *BillingService) fetchHistoricalRateFromAPI(ctx context.Context, date, currency string) (float64, error) {
	appID := bs.cfg.OpenExchange.AppID
	if appID == "" {
		return 0, errors.New("OpenExchange AppID is not configured")
	}

	url := fmt.Sprintf("https://openexchangerates.org/api/historical/%s.json?app_id=%s&symbols=%s", date, appID, currency)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, err
	}

	resp, err := bs.http.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("API returned a non-OK status: %s", resp.Status)
	}

	var apiResponse OpenExchangeResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return 0, err
	}

	rate, ok := apiResponse.Rates[currency]
	if !ok {
		return 0, fmt.Errorf("currency %s not found in API response for date %s", currency, date)
	}

	return rate, nil
}
