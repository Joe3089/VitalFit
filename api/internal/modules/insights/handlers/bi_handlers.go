package insightshandlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIKeyMiddleware authenticates BI tools with the X-API-Key header.
func (h *InsightsHandlers) APIKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("X-API-Key")
		if key == "" {
			h.services.LogErrors.UnauthorizedErrorResponse(c, errors.New("missing X-API-Key header"))
			c.Abort()
			return
		}
		apiKey, err := h.services.InsightsServices.AuthenticateAPIKey(c.Request.Context(), key)
		if err != nil {
			h.services.LogErrors.UnauthorizedErrorResponse(c, errors.New("invalid or revoked API key"))
			c.Abort()
			return
		}
		c.Set("bi_api_key", apiKey)
		c.Next()
	}
}

// @Summary		BI: consolidated KPIs for a period
// @Description	Revenue, check-ins, new clients, active members, occupancy, NPS and web conversion.
// @Tags			BI
// @Security		BIApiKey
// @Produce		json
// @Param			start	query		string	false	"YYYY-MM-DD"
// @Param			end		query		string	false	"YYYY-MM-DD"
// @Success		200		{object}	object
// @Router			/bi/kpis [get]
func (h *InsightsHandlers) BIKPIsHandler(c *gin.Context) {
	r, err := dateRange(c)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	ctx := c.Request.Context()
	bench, err := h.services.InsightsServices.GetBenchmark(ctx, r)
	if err != nil {
		h.fail(c, err)
		return
	}
	conv, err := h.services.InsightsServices.GetConversionStats(ctx, r)
	if err != nil {
		h.fail(c, err)
		return
	}
	nps, err := h.services.InsightsServices.GetNPSSummary(ctx, r)
	if err != nil {
		h.fail(c, err)
		return
	}
	var revenue float64
	var checkIns, newClients, active, capacity, booked int64
	for _, b := range bench.Branches {
		revenue += b.Revenue
		checkIns += b.CheckIns
		newClients += b.NewClients
		active += b.ActiveMembers
		capacity += b.Capacity
		booked += b.Booked
	}
	occupancy := 0.0
	if capacity > 0 {
		occupancy = float64(int64(10000*float64(booked)/float64(capacity))) / 100
	}
	c.JSON(http.StatusOK, gin.H{
		"period":          gin.H{"start": r.Start.Format(dateLayout), "end": r.End.AddDate(0, 0, -1).Format(dateLayout)},
		"revenue":         revenue,
		"check_ins":       checkIns,
		"new_clients":     newClients,
		"active_members":  active,
		"occupancy_rate":  occupancy,
		"nps":             nps.NPS,
		"nps_responses":   nps.Responses,
		"conversion_rate": conv.ConversionRate,
		"web_visitors":    conv.Visitors,
		"branches":        bench.Branches,
	})
}

// @Summary		BI: detailed sales rows
// @Tags			BI
// @Security		BIApiKey
// @Produce		json
// @Param			start		query		string	false	"YYYY-MM-DD"
// @Param			end			query		string	false	"YYYY-MM-DD"
// @Param			branch_id	query		string	false	"Branch ID"
// @Success		200			{object}	object{data=[]reportdomain.SalesReportRow}
// @Router			/bi/sales [get]
func (h *InsightsHandlers) BISalesHandler(c *gin.Context) {
	branchID, r, ok := h.branchAndRange(c)
	if !ok {
		return
	}
	rows, err := h.services.ReportServices.GetSalesReportData(c.Request.Context(), branchID, r.Start, r.End)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		BI: detailed financial rows
// @Tags			BI
// @Security		BIApiKey
// @Produce		json
// @Param			start		query		string	false	"YYYY-MM-DD"
// @Param			end			query		string	false	"YYYY-MM-DD"
// @Param			branch_id	query		string	false	"Branch ID"
// @Success		200			{object}	object{data=[]reportdomain.FinancialReportRow}
// @Router			/bi/financial [get]
func (h *InsightsHandlers) BIFinancialHandler(c *gin.Context) {
	branchID, r, ok := h.branchAndRange(c)
	if !ok {
		return
	}
	rows, err := h.services.ReportServices.GetFinancialReportData(c.Request.Context(), branchID, r.Start, r.End)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}
