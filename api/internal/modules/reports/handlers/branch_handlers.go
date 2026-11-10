package reporthandlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// @Summary		Get Monthly Sales KPI
// @Description	Retrieves total accumulated sales for the current month and the trend vs previous month.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Monthly sales KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/monthly-sales [get]
func (h *ReportHanlders) GetMonthlySalesKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	kpi, err := h.services.ReportServices.GetMonthlySalesKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Active Members KPI
// @Description	Retrieves the count of unique active members (based on attendance in the last 30 days). If branch_id is provided, filters by branch; otherwise, returns global count.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Active members KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/active-members [get]
func (h *ReportHanlders) GetActiveMembersKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	kpi, err := h.services.ReportServices.GetActiveMembersKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Occupancy KPI
// @Description	Retrieves the average daily occupancy percentage for the current month compared to max capacity.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Occupancy KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/occupancy [get]
func (h *ReportHanlders) GetOccupancyKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	kpi, err := h.services.ReportServices.GetOccupancyKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Weekly Sales Chart
// @Description	Retrieves daily sales trend for the current week (Mon-Sun).
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.ChartData}	"Weekly sales data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/weekly-sales [get]
func (h *ReportHanlders) GetWeeklySalesChartHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetWeeklySalesChart(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Activity Heatmap
// @Description	Retrieves attendance density grouped by day of week and 3-hour blocks (last 30 days).
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string										false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.HeatmapPoint}	"Heatmap data"
// @Failure		500			{object}	object{error=string}						"Internal Server Error"
// @Router			/reports/charts/activity-heatmap [get]
func (h *ReportHanlders) GetActivityHeatmapHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetActivityHeatmap(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Class Occupancy Chart
// @Description	Retrieves average occupancy percentage per class category for the current month.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.ChartData}	"Class occupancy data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/class-occupancy [get]
func (h *ReportHanlders) GetClassOccupancyChartHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetClassOccupancyChart(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Financial Summary
// @Description	Retrieves revenue breakdown by business unit (Memberships, Services, Products) for the current month.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string										false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.FinancialSummary}	"Financial summary data"
// @Failure		500			{object}	object{error=string}						"Internal Server Error"
// @Router			/reports/kpi/financial-summary [get]
func (h *ReportHanlders) GetFinancialSummaryHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	summary, err := h.services.ReportServices.GetFinancialSummary(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": summary})
}
