package billinghandlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// @Summary		Get latest exchange rates
// @Description	Retrieves the latest currency exchange rates from the configured provider. It uses a cache to avoid hitting the API on every request.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	map[string]float64		"A map of currency codes to their exchange rates against the base currency (USD)"
// @Failure		500	{object}	object{error=string}	"Failed to retrieve exchange rates"
// @Router			/billing/rates [get]
func (h *BillingHandlers) GetRates(c *gin.Context) {
	rates, err := h.services.BillingServices.GetLatestRates(c.Request.Context())
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, rates)
}

// @Summary		Get specific currency exchange rate
// @Description	Retrieves the latest exchange rate for a specific currency code.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			currency	path		string						true	"Currency Code (e.g., VES)"
// @Success		200			{object}	object{currency=float64}	"The exchange rate for the specified currency"
// @Failure		404			{object}	object{error=string}		"Currency not found"
// @Failure		500			{object}	object{error=string}		"Failed to retrieve exchange rates"
// @Router			/billing/rates/{currency} [get]
func (h *BillingHandlers) GetSpecificCurrencyRates(c *gin.Context) {
	currencyCode := c.Param("currency")
	rates, err := h.services.BillingServices.GetLatestRates(c.Request.Context())
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	rate, ok := rates[currencyCode]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Currency not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{currencyCode: rate})

}

// @Summary		Get historical exchange rate for a currency
// @Description	Retrieves the exchange rate for a specific currency on a specific date.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			date		path		string						true	"Date in YYYY-MM-DD format"
// @Param			currency	path		string						true	"Currency Code (e.g., VES)"
// @Success		200			{object}	object{currency=float64}	"The historical exchange rate for the specified currency and date"
// @Failure		400			{object}	object{error=string}		"Bad Request (e.g., invalid date format)"
// @Failure		404			{object}	object{error=string}		"Currency not found for the given date"
// @Failure		500			{object}	object{error=string}		"Failed to retrieve exchange rates"
// @Router			/billing/rates/historical/{date}/{currency} [get]
func (h *BillingHandlers) GetHistoricalSpecificCurrencyRateHandler(c *gin.Context) {
	date := c.Param("date")
	dateparsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	currencyCode := c.Param("currency")
	rate, err := h.services.BillingServices.GetHistoricalRateForCurrency(c.Request.Context(), dateparsed.Format("2006-01-02"), currencyCode)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{currencyCode: rate})

}
