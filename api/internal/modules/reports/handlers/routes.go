package reporthandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type ReportHandlersInterface interface {
	ReportRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	GetGlobalSalesStatsHandler(c *gin.Context)
	GetMonthlySalesKPIHandler(c *gin.Context)
	GetActiveMembersKPIHandler(c *gin.Context)
	GetOccupancyKPIHandler(c *gin.Context)
	GetTotalSalesHandler(c *gin.Context)
	GetFinancialSummaryHandler(c *gin.Context)
	GetTodayCheckInsStatHandler(c *gin.Context)
	GetCurrentOccupancyStatHandler(c *gin.Context)
	GetTopBranchesPerformanceHandler(c *gin.Context)
	GetTotalClientsStatHandler(c *gin.Context)
	GetActiveBranchesCountHandler(c *gin.Context)
	GetSalesByCategoryHandler(c *gin.Context)
	GetTopInstructorsByAttendanceHandler(c *gin.Context)
	GetSalesByPaymentMethodHandler(c *gin.Context)
	GetSalesByHourHandler(c *gin.Context)
	GetMostUsedServicesHandler(c *gin.Context)
	GetWeeklySalesChartHandler(c *gin.Context)
	GetActivityHeatmapHandler(c *gin.Context)
	GetClassOccupancyChartHandler(c *gin.Context)
	GetClassCapacityRatioHandler(c *gin.Context)
	GetUpcomingClassesTodayHandler(c *gin.Context)
	GetRecentCheckInsHandler(c *gin.Context)
	GetInstructorNextClassHandler(c *gin.Context)
	GetInstructorStudentCountKPIHandler(c *gin.Context)
	GetInstructorMonthlyClassesCountHandler(c *gin.Context)
	GetInstructorClassesTodayHandler(c *gin.Context)
	GetInstructorStudentsTodayHandler(c *gin.Context)
	GetInstructorAttendanceRateHandler(c *gin.Context)
	GetWeeklyRevenueKPIHandler(c *gin.Context)
	GetAverageTicketKPIHandler(c *gin.Context)
	GetAccountsReceivableKPIHandler(c *gin.Context)
	GetMonthlyRecurringRevenueKPIHandler(c *gin.Context)
	GetMonthlyRevenueChartHandler(c *gin.Context)
	GetBillingByBranchMatrixHandler(c *gin.Context)
	GetTotalTransactionsHandler(c *gin.Context)
	GetNewClientsKPIHandler(c *gin.Context)
	GetMonthlyCashFlowChartHandler(c *gin.Context)
	GetRetentionRateKPIHandler(c *gin.Context)
	GetAverageCLVKPIHandler(c *gin.Context)
	GetNewVsRecurringChartHandler(c *gin.Context)
	GetCohortAnalysisHandler(c *gin.Context)
	ExportFinancialReportHandler(c *gin.Context)
	ExportClientReportHandler(c *gin.Context)
	ExportSalesReportHandler(c *gin.Context)
	GetRFMAnalysisHandler(c *gin.Context)
}

type ReportHanlders struct {
	services appservices.Services
}

func NewReportHandlers(services appservices.Services) *ReportHanlders {
	return &ReportHanlders{
		services: services,
	}
}

func (r *ReportHanlders) ReportRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	reportsGroup := rg.Group("/reports")
	reportsGroup.Use(m.AuthJwtTokenMiddleware())

	// Sales Routes
	salesGroup := reportsGroup.Group("")
	salesGroup.Use(m.RBACPermission("reports:view_sales"))
	{
		salesGroup.GET("/stats/global", r.GetGlobalSalesStatsHandler)
		salesGroup.GET("/stats/total-sales", r.GetTotalSalesHandler)
		salesGroup.GET("/stats/top-branches", r.GetTopBranchesPerformanceHandler)

		salesGroup.GET("/kpi/monthly-sales", r.GetMonthlySalesKPIHandler)

		salesGroup.GET("/charts/sales-by-category", r.GetSalesByCategoryHandler)
		salesGroup.GET("/charts/sales-by-payment-method", r.GetSalesByPaymentMethodHandler)
		salesGroup.GET("/charts/sales-by-hour", r.GetSalesByHourHandler)
		salesGroup.GET("/charts/weekly-sales", r.GetWeeklySalesChartHandler)
		salesGroup.GET("/charts/monthly-revenue", r.GetMonthlyRevenueChartHandler)
		salesGroup.GET("/charts/new-vs-recurring", r.GetNewVsRecurringChartHandler)
		salesGroup.GET("/charts/cohort-analysis", r.GetCohortAnalysisHandler)
		salesGroup.GET("/charts/sales-by-demographics", r.GetSalesByDemographicsHandler)
		salesGroup.GET("/analysis/rfm", r.GetRFMAnalysisHandler)
	}

	// Financial Routes
	financialGroup := reportsGroup.Group("")
	financialGroup.Use(m.RBACPermission("reports:view_financial"))
	{
		financialGroup.GET("/kpi/financial-summary", r.GetFinancialSummaryHandler)
		financialGroup.GET("/kpi/weekly-revenue", r.GetWeeklyRevenueKPIHandler)
		financialGroup.GET("/kpi/average-ticket", r.GetAverageTicketKPIHandler)
		financialGroup.GET("/kpi/accounts-receivable", r.GetAccountsReceivableKPIHandler)
		financialGroup.GET("/kpi/mrr", r.GetMonthlyRecurringRevenueKPIHandler)
		financialGroup.GET("/kpi/billing-matrix", r.GetBillingByBranchMatrixHandler)
		financialGroup.GET("/kpi/total-transactions", r.GetTotalTransactionsHandler)
		financialGroup.GET("/kpi/clv", r.GetAverageCLVKPIHandler)
		financialGroup.GET("/charts/cash-flow", r.GetMonthlyCashFlowChartHandler)
		financialGroup.GET("/export/financial", r.ExportFinancialReportHandler)
		financialGroup.GET("/export/clients", r.ExportClientReportHandler)
		financialGroup.GET("/export/sales", r.ExportSalesReportHandler)
	}

	// Attendance Routes
	attendanceGroup := reportsGroup.Group("")
	attendanceGroup.Use(m.RBACPermission("reports:view_attendance"))
	{
		attendanceGroup.GET("/stats/total-clients", r.GetTotalClientsStatHandler)
		attendanceGroup.GET("/stats/total-active-branches", r.GetActiveBranchesCountHandler)
		attendanceGroup.GET("/stats/check-ins-today", r.GetTodayCheckInsStatHandler)
		attendanceGroup.GET("/stats/current-occupancy", r.GetCurrentOccupancyStatHandler)
		attendanceGroup.GET("/stats/class-capacity", r.GetClassCapacityRatioHandler)
		attendanceGroup.GET("/stats/upcoming-classes", r.GetUpcomingClassesTodayHandler)
		attendanceGroup.GET("/stats/recent-check-ins", r.GetRecentCheckInsHandler)
		attendanceGroup.GET("/instructors/next-class", r.GetInstructorNextClassHandler)
		attendanceGroup.GET("/instructors/student-count", r.GetInstructorStudentCountKPIHandler)
		attendanceGroup.GET("/instructors/classes-count", r.GetInstructorMonthlyClassesCountHandler)
		attendanceGroup.GET("/instructors/classes-today", r.GetInstructorClassesTodayHandler)
		attendanceGroup.GET("/instructors/students-today", r.GetInstructorStudentsTodayHandler)
		attendanceGroup.GET("/instructors/attendance-rate", r.GetInstructorAttendanceRateHandler)
		attendanceGroup.GET("/kpi/active-members", r.GetActiveMembersKPIHandler)
		attendanceGroup.GET("/kpi/new-clients", r.GetNewClientsKPIHandler)
		attendanceGroup.GET("/kpi/retention-rate", r.GetRetentionRateKPIHandler)
		attendanceGroup.GET("/kpi/churn-rate", r.GetChurnRateKPIHandler)
		attendanceGroup.GET("/kpi/occupancy", r.GetOccupancyKPIHandler)
		attendanceGroup.GET("/charts/top-instructors", r.GetTopInstructorsByAttendanceHandler)
		attendanceGroup.GET("/charts/most-used-services", r.GetMostUsedServicesHandler)
		attendanceGroup.GET("/charts/activity-heatmap", r.GetActivityHeatmapHandler)
		attendanceGroup.GET("/charts/class-occupancy", r.GetClassOccupancyChartHandler)
	}
}
