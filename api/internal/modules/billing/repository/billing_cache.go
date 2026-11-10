package billingrepository

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
)

type memEntry struct {
	value   any
	expires time.Time
}

// BillingStoreCache stores exchange rates in Redis. When Redis is disabled
// (REDIS_ENABLED=false, rdb == nil) an in-process cache with the same expiry
// semantics is used instead.
type BillingStoreCache struct {
	rdb *redis.Client
	mu  sync.Mutex
	mem map[string]memEntry
}

func NewBillingCacheStore(rdb *redis.Client) *BillingStoreCache {
	return &BillingStoreCache{rdb: rdb, mem: map[string]memEntry{}}
}

func (r *BillingStoreCache) memSet(key string, v any, ttl time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.mem[key] = memEntry{value: v, expires: time.Now().Add(ttl)}
}

func (r *BillingStoreCache) memGet(key string) (any, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	e, ok := r.mem[key]
	if !ok || time.Now().After(e.expires) {
		delete(r.mem, key)
		return nil, redis.Nil
	}
	return e.value, nil
}

func (r *BillingStoreCache) SetRates(ctx context.Context, rates map[string]float64) error {
	if r.rdb == nil {
		copied := make(map[string]float64, len(rates))
		for k, v := range rates {
			copied[k] = v
		}
		r.memSet(billingdomain.LatestRatesKey, copied, billingdomain.LatestRatesExpiration)
		return nil
	}
	ratesMap := make(map[string]interface{}, len(rates))
	for k, v := range rates {
		ratesMap[k] = v
	}

	pipe := r.rdb.Pipeline()
	pipe.HSet(ctx, billingdomain.LatestRatesKey, ratesMap)
	pipe.Expire(ctx, billingdomain.LatestRatesKey, billingdomain.LatestRatesExpiration)

	_, err := pipe.Exec(ctx)
	return err
}

func (r *BillingStoreCache) GetRates(ctx context.Context) (map[string]float64, error) {
	if r.rdb == nil {
		v, err := r.memGet(billingdomain.LatestRatesKey)
		if err != nil {
			return nil, err
		}
		return v.(map[string]float64), nil
	}
	stringRates, err := r.rdb.HGetAll(ctx, billingdomain.LatestRatesKey).Result()
	if err != nil {
		return nil, err
	}

	if len(stringRates) == 0 {
		return nil, redis.Nil
	}

	rates := make(map[string]float64, len(stringRates))
	for currency, rateStr := range stringRates {
		rateFloat, err := strconv.ParseFloat(rateStr, 64)
		if err != nil {
			log.Printf("Error al parsear tasa para %s: %v", currency, err)
			continue
		}
		rates[currency] = rateFloat
	}

	return rates, nil
}

func (r *BillingStoreCache) DeleteRates(ctx context.Context) error {
	if r.rdb == nil {
		r.mu.Lock()
		delete(r.mem, billingdomain.LatestRatesKey)
		r.mu.Unlock()
		return nil
	}
	return r.rdb.Del(ctx, billingdomain.LatestRatesKey).Err()
}

func (r *BillingStoreCache) SetSpecificTimeRateForCurrency(ctx context.Context, date string, currency string, rate float64) error {
	key := fmt.Sprintf("%s:%s:%s", billingdomain.RatePrefix, date, currency)
	if r.rdb == nil {
		r.memSet(key, rate, billingdomain.RateExpiration)
		return nil
	}

	return r.rdb.Set(ctx, key, rate, billingdomain.RateExpiration).Err()
}

func (r *BillingStoreCache) GetSpecificTimeRateForCurrency(ctx context.Context, date string, currency string) (float64, error) {
	key := fmt.Sprintf("%s:%s:%s", billingdomain.RatePrefix, date, currency)
	if r.rdb == nil {
		v, err := r.memGet(key)
		if err != nil {
			return 0, err
		}
		return v.(float64), nil
	}

	rateStr, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return 0, err
	}

	return strconv.ParseFloat(rateStr, 64)
}
