package reportdomain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type ReportRepository interface {
	GetGlobalSalesStats(ctx context.Context) (*GlobalSalesStats, error)
	GetTotalSales(ctx context.Context) (*TotalSalesStats, error)
	GetMonthlySalesKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetActiveMembersKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetOccupancyKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetTopBranchesPerformance(ctx context.Context) ([]BranchPerformance, error)
	GetTotalClientsStat(ctx context.Context) (int64, error)
	GetActiveBranchesCount(ctx context.Context) (int64, error)
	GetSalesByCategory(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]ChartData, error)
	GetTopInstructorsByAttendance(ctx context.Context, start, end time.Time) ([]ChartData, error)
	GetSalesByPaymentMethod(ctx context.Context, start, end time.Time) ([]ChartData, error)
	GetSalesByHour(ctx context.Context, start, end time.Time) ([]ChartData, error)
	GetMostUsedServices(ctx context.Context, start, end time.Time) ([]ChartData, error)
	GetWeeklySalesChart(ctx context.Context, branchID *uuid.UUID) ([]ChartData, error)
	GetActivityHeatmap(ctx context.Context, branchID *uuid.UUID) ([]HeatmapPoint, error)
	GetClassOccupancyChart(ctx context.Context, branchID *uuid.UUID) ([]ChartData, error)
	GetFinancialSummary(ctx context.Context, branchID *uuid.UUID) (*FinancialSummary, error)
	GetTodayCheckInsStat(ctx context.Context, branchID *uuid.UUID) (int64, error)
	GetCurrentOccupancyStat(ctx context.Context, branchID *uuid.UUID) (decimal.Decimal, error)
	GetClassCapacityRatio(ctx context.Context, classID uuid.UUID) (*ClassCapacityStats, error)
	GetUpcomingClassesToday(ctx context.Context, branchID *uuid.UUID) ([]ClassScheduleItem, error)
	GetRecentCheckIns(ctx context.Context, branchID *uuid.UUID) ([]RecentAttendanceItem, error)
	GetInstructorNextClass(ctx context.Context, instructorID uuid.UUID) (*time.Time, error)
	GetInstructorIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error)
	GetInstructorStudentCountKPI(ctx context.Context, instructorID uuid.UUID) (*KPICard, error)
	GetInstructorMonthlyClassesCount(ctx context.Context, instructorID uuid.UUID) (*KPICard, error)
	GetInstructorClassesToday(ctx context.Context, instructorID uuid.UUID) ([]ClassScheduleItem, error)
	GetWeeklyRevenueKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetAverageTicketKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetAccountsReceivableKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetMonthlyRecurringRevenueKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetMonthlyRevenueChart(ctx context.Context, branchID *uuid.UUID) ([]ChartData, error)
	GetBillingByBranchMatrix(ctx context.Context, start, end time.Time) (*BillingMatrix, error)
	GetTotalTransactions(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetNewClientsKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetRetentionRateKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetAverageCLVKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetNewVsRecurringChart(ctx context.Context, branchID *uuid.UUID) ([]StackedChartData, error)
	GetCohortAnalysis(ctx context.Context, branchID *uuid.UUID) ([]CohortRetention, error)
	GetMonthlyCashFlowChart(ctx context.Context, branchID *uuid.UUID) ([]ChartData, error)
	GetSalesByDemographics(ctx context.Context, branchID *uuid.UUID, start, end time.Time, dimension string) ([]ChartData, error)
	GetClientsChurnMetrics(ctx context.Context) ([]ClientChurnMetrics, error)
	GetBranchManagers(ctx context.Context) (map[uuid.UUID]BranchManagerDetails, error)
	GetChurnRateKPI(ctx context.Context, branchID *uuid.UUID) (*KPICard, error)
	GetFinancialReportData(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]FinancialReportRow, error)
	GetSalesReportData(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]SalesReportRow, error)
	GetRFMData(ctx context.Context, branchID *uuid.UUID) ([]RFMMetric, error)
}
