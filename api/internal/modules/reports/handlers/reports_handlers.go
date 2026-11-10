package reporthandlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// @Summary		Get Global Sales Stats
// @Description	Retrieves global sales statistics, comparing the current month's sales with the previous month.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=reportdomain.GlobalSalesStats}	"Global sales statistics"
// @Failure		500	{object}	object{error=string}						"Internal Server Error"
// @Router			/reports/stats/global [get]
func (h *ReportHanlders) GetGlobalSalesStatsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	stats, err := h.services.ReportServices.GetGlobalSalesStats(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// @Summary		Get Total Sales
// @Description	Retrieves the total accumulated sales amount from all time.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=reportdomain.TotalSalesStats}	"Total sales statistics"
// @Failure		500	{object}	object{error=string}						"Internal Server Error"
// @Router			/reports/stats/total-sales [get]
func (h *ReportHanlders) GetTotalSalesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	totalSales, err := h.services.ReportServices.GetTotalSales(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": totalSales})
}

// @Summary		Get Top 5 Branches Performance
// @Description	Retrieves the performance of the top 5 branches based on current month's sales.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]reportdomain.BranchPerformance}	"Top 5 branches performance"
// @Failure		500	{object}	object{error=string}							"Internal Server Error"
// @Router			/reports/stats/top-branches [get]
func (h *ReportHanlders) GetTopBranchesPerformanceHandler(c *gin.Context) {
	ctx := c.Request.Context()

	topBranches, err := h.services.ReportServices.GetTopBranchesPerformance(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": topBranches})
}

// @Summary		Get Total Clients Stat
// @Description	Retrieves the total number of users with the 'client' role.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=int64}		"Total number of clients"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/stats/total-clients [get]
func (h *ReportHanlders) GetTotalClientsStatHandler(c *gin.Context) {
	ctx := c.Request.Context()
	totalClients, err := h.services.ReportServices.GetTotalClientsStat(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": totalClients})
}

// @Summary		Get Active Branches Count
// @Description	Retrieves the total number of active branches.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=int64}		"Total number of active branches"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/stats/total-active-branches [get]
func (h *ReportHanlders) GetActiveBranchesCountHandler(c *gin.Context) {
	ctx := c.Request.Context()
	count, err := h.services.ReportServices.GetActiveBranchesCount(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": count})
}

// @Summary		Get Today's Check-Ins
// @Description	Retrieves the count of check-ins for the current day.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string					false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=int64}		"Count of check-ins"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/stats/check-ins-today [get]
func (h *ReportHanlders) GetTodayCheckInsStatHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	count, err := h.services.ReportServices.GetTodayCheckInsStat(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": count})
}

// @Summary		Get Current Occupancy Percentage
// @Description	Retrieves the real-time occupancy percentage based on check-ins within the current hour vs max capacity.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string					false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=float64}	"Occupancy percentage"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/stats/current-occupancy [get]
func (h *ReportHanlders) GetCurrentOccupancyStatHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	occupancy, err := h.services.ReportServices.GetCurrentOccupancyStat(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": occupancy})
}

// @Summary		Get Class Capacity Ratio
// @Description	Retrieves the attendance vs capacity ratio for a specific class (e.g. "25 / 30").
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			class_id	query		string											true	"Class UUID"
// @Success		200			{object}	object{data=reportdomain.ClassCapacityStats}	"Class capacity stats"
// @Failure		400			{object}	object{error=string}							"Bad Request"
// @Failure		500			{object}	object{error=string}							"Internal Server Error"
// @Router			/reports/stats/class-capacity [get]
func (h *ReportHanlders) GetClassCapacityRatioHandler(c *gin.Context) {
	ctx := c.Request.Context()
	idStr := c.Query("class_id")
	classID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class_id"})
		return
	}
	stats, err := h.services.ReportServices.GetClassCapacityRatio(ctx, classID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// @Summary		Get Upcoming Classes Today
// @Description	Retrieves a list of classes scheduled for the rest of the current day.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string											false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.ClassScheduleItem}	"List of upcoming classes"
// @Failure		500			{object}	object{error=string}							"Internal Server Error"
// @Router			/reports/stats/upcoming-classes [get]
func (h *ReportHanlders) GetUpcomingClassesTodayHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	classes, err := h.services.ReportServices.GetUpcomingClassesToday(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": classes})
}

// @Summary		Get Recent Check-Ins
// @Description	Retrieves the last 4 check-ins for the current day.
// @Tags			Reports Branch
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string												false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.RecentAttendanceItem}	"List of recent check-ins"
// @Failure		500			{object}	object{error=string}								"Internal Server Error"
// @Router			/reports/stats/recent-check-ins [get]
func (h *ReportHanlders) GetRecentCheckInsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	recentCheckIns, err := h.services.ReportServices.GetRecentCheckIns(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": recentCheckIns})
}

// @Summary		Get New Clients KPI
// @Description	Retrieves the count of new clients registered in the current month compared to the previous month.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID (Currently Global)"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"New Clients KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/new-clients [get]
func (h *ReportHanlders) GetNewClientsKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetNewClientsKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get RFM Analysis
// @Description	Retrieves the RFM (Recency, Frequency, Monetary) analysis for clients.
// @Description	Recency: Days since last purchase. Frequency: Total number of purchases. Monetary: Total amount spent.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.RFMMetric}	"RFM Analysis Data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/analysis/rfm [get]
func (h *ReportHanlders) GetRFMAnalysisHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	data, err := h.services.ReportServices.GetRFMAnalysis(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Churn Rate KPI
// @Description	Retrieves the percentage of clients who left (churned) during the current month compared to the start of the month. Formula: ((Lost Clients) / Start Clients) * 100.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Churn Rate KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/churn-rate [get]
func (h *ReportHanlders) GetChurnRateKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	kpi, err := h.services.ReportServices.GetChurnRateKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Retention Rate KPI
// @Description	Retrieves the percentage of existing clients who remained active during the current month. Formula: ((End Clients - New Clients) / Start Clients) * 100.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID (Currently Global)"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Retention Rate KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/retention-rate [get]
func (h *ReportHanlders) GetRetentionRateKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID

	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	kpi, err := h.services.ReportServices.GetRetentionRateKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}
