package reporthandlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parseTimeRange(c *gin.Context) (time.Time, time.Time) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	layout := "2006-01-02"

	startStr := c.DefaultQuery("start", startOfMonth.Format(layout))
	endStr := c.DefaultQuery("end", endOfMonth.Format(layout))

	start, err := time.Parse(layout, startStr)
	if err != nil {
		start = startOfMonth
	}

	end, err := time.Parse(layout, endStr)
	if err != nil {
		end = endOfMonth
	}

	return start, end
}

// @Summary		Get Sales Volume By Service (Category)
// @Description	Retrieves sales data grouped by category (Memberships, Packages, Service Categories) ordered by revenue. Ideal for Horizontal Bar Charts.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Param			start		query		string									false	"Start date for the report (YYYY-MM-DD)"
// @Param			end			query		string									false	"End date for the report (YYYY-MM-DD)"
// @Success		200			{object}	object{data=[]reportdomain.ChartData}	"Sales volume by category data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/sales-by-category [get]
func (h *ReportHanlders) GetSalesByCategoryHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetSalesByCategory(ctx, branchID, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Cohort Analysis (Retention Heatmap)
// @Description	Retrieves user retention percentages grouped by registration month (cohort). Month 0 is always 100%. Subsequent months show the % of users who made a payment.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string										false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.CohortRetention}	"Cohort analysis data"
// @Failure		500			{object}	object{error=string}						"Internal Server Error"
// @Router			/reports/charts/cohort-analysis [get]
func (h *ReportHanlders) GetCohortAnalysisHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetCohortAnalysis(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Top Instructors by Attendance
// @Description	Retrieves the top 5 instructors with the most class attendances for a Bar Chart.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string									false	"Start date for the report (YYYY-MM-DD)"
// @Param			end		query		string									false	"End date for the report (YYYY-MM-DD)"
// @Success		200		{object}	object{data=[]reportdomain.ChartData}	"Top instructors by attendance"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/top-instructors [get]
func (h *ReportHanlders) GetTopInstructorsByAttendanceHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)

	data, err := h.services.ReportServices.GetTopInstructorsByAttendance(ctx, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Sales By Payment Method
// @Description	Retrieves sales data grouped by payment method for a Pie Chart.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string									false	"Start date for the report (YYYY-MM-DD)"
// @Param			end		query		string									false	"End date for the report (YYYY-MM-DD)"
// @Success		200		{object}	object{data=[]reportdomain.ChartData}	"Sales by payment method data"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/sales-by-payment-method [get]
func (h *ReportHanlders) GetSalesByPaymentMethodHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)

	data, err := h.services.ReportServices.GetSalesByPaymentMethod(ctx, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Sales By Hour
// @Description	Retrieves sales data grouped by the hour of the day for a Line Chart.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]reportdomain.ChartData}	"Sales by hour data"
// @Failure		500	{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/sales-by-hour [get]
func (h *ReportHanlders) GetSalesByHourHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)

	data, err := h.services.ReportServices.GetSalesByHour(ctx, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Most Used Services
// @Description	Retrieves the top 5 most used services based on attendance.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string									false	"Start date for the report (YYYY-MM-DD)"
// @Param			end		query		string									false	"End date for the report (YYYY-MM-DD)"
// @Success		200		{object}	object{data=[]reportdomain.ChartData}	"Most used services data"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/most-used-services [get]
func (h *ReportHanlders) GetMostUsedServicesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)

	data, err := h.services.ReportServices.GetMostUsedServices(ctx, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get New vs Recurring Users Chart
// @Description	Retrieves the evolution of New vs Recurring users per month for the current year. Ideal for Stacked Area Charts.
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string											false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.StackedChartData}	"New vs Recurring data"
// @Failure		500			{object}	object{error=string}							"Internal Server Error"
// @Router			/reports/charts/new-vs-recurring [get]
func (h *ReportHanlders) GetNewVsRecurringChartHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetNewVsRecurringChart(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Sales By Demographics
// @Description	Retrieves sales volume grouped by demographic dimension (age or gender).
// @Tags			Reports
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Param			start		query		string									false	"Start date (YYYY-MM-DD)"
// @Param			end			query		string									false	"End date (YYYY-MM-DD)"
// @Param			dimension	query		string									true	"Dimension: 'age' or 'gender'"
// @Success		200			{object}	object{data=[]reportdomain.ChartData}	"Demographic sales data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/sales-by-demographics [get]
func (h *ReportHanlders) GetSalesByDemographicsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)
	dimension := c.Query("dimension")
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}

	data, err := h.services.ReportServices.GetSalesByDemographics(ctx, branchID, start, end, dimension)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}
