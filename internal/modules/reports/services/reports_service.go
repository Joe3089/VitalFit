package reportservices

import (
	"context"
	"math"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	reportdomain "github.com/vitalfit/api/internal/modules/reports/domain"
	"github.com/vitalfit/api/internal/store"
)

type ReportService struct {
	store store.Storage
}

func NewReportService(store store.Storage) *ReportService {
	return &ReportService{
		store: store,
	}

}

func (s *ReportService) GetGlobalSalesStats(ctx context.Context) (*reportdomain.GlobalSalesStats, error) {
	return s.store.Reports.GetGlobalSalesStats(ctx)
}

func (s *ReportService) GetTotalSales(ctx context.Context) (*reportdomain.TotalSalesStats, error) {
	return s.store.Reports.GetTotalSales(ctx)
}

func (s *ReportService) GetMonthlySalesKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetMonthlySalesKPI(ctx, branchID)
}

func (s *ReportService) GetActiveMembersKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetActiveMembersKPI(ctx, branchID)
}

func (s *ReportService) GetOccupancyKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetOccupancyKPI(ctx, branchID)
}

func (s *ReportService) GetTopBranchesPerformance(ctx context.Context) ([]reportdomain.BranchPerformance, error) {
	return s.store.Reports.GetTopBranchesPerformance(ctx)
}

func (s *ReportService) GetTotalClientsStat(ctx context.Context) (int64, error) {
	return s.store.Reports.GetTotalClientsStat(ctx)
}

func (s *ReportService) GetActiveBranchesCount(ctx context.Context) (int64, error) {
	return s.store.Reports.GetActiveBranchesCount(ctx)
}

func (s *ReportService) GetSalesByCategory(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetSalesByCategory(ctx, branchID, start, end)
}

func (s *ReportService) GetTopInstructorsByAttendance(ctx context.Context, start, end time.Time) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetTopInstructorsByAttendance(ctx, start, end)
}

func (s *ReportService) GetSalesByPaymentMethod(ctx context.Context, start, end time.Time) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetSalesByPaymentMethod(ctx, start, end)
}

func (s *ReportService) GetSalesByHour(ctx context.Context, start, end time.Time) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetSalesByHour(ctx, start, end)
}

func (s *ReportService) GetMostUsedServices(ctx context.Context, start, end time.Time) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetMostUsedServices(ctx, start, end)
}

func (s *ReportService) GetWeeklySalesChart(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetWeeklySalesChart(ctx, branchID)
}

func (s *ReportService) GetActivityHeatmap(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.HeatmapPoint, error) {
	return s.store.Reports.GetActivityHeatmap(ctx, branchID)
}

func (s *ReportService) GetClassOccupancyChart(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetClassOccupancyChart(ctx, branchID)
}

func (s *ReportService) GetFinancialSummary(ctx context.Context, branchID *uuid.UUID) (*reportdomain.FinancialSummary, error) {
	return s.store.Reports.GetFinancialSummary(ctx, branchID)
}

func (s *ReportService) GetTodayCheckInsStat(ctx context.Context, branchID *uuid.UUID) (int64, error) {
	return s.store.Reports.GetTodayCheckInsStat(ctx, branchID)
}

func (s *ReportService) GetCurrentOccupancyStat(ctx context.Context, branchID *uuid.UUID) (decimal.Decimal, error) {
	return s.store.Reports.GetCurrentOccupancyStat(ctx, branchID)
}

func (s *ReportService) GetClassCapacityRatio(ctx context.Context, classID uuid.UUID) (*reportdomain.ClassCapacityStats, error) {
	return s.store.Reports.GetClassCapacityRatio(ctx, classID)
}

func (s *ReportService) GetUpcomingClassesToday(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.ClassScheduleItem, error) {
	return s.store.Reports.GetUpcomingClassesToday(ctx, branchID)
}

func (s *ReportService) GetRecentCheckIns(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.RecentAttendanceItem, error) {
	return s.store.Reports.GetRecentCheckIns(ctx, branchID)
}

func (s *ReportService) GetInstructorNextClass(ctx context.Context, instructorID uuid.UUID) (string, error) {
	nextClassTime, err := s.store.Reports.GetInstructorNextClass(ctx, instructorID)
	if err != nil {
		return "", err
	}
	if nextClassTime == nil {
		return "Sin pendientes", nil
	}
	return nextClassTime.Format("03:04 PM"), nil
}

func (s *ReportService) GetInstructorIDByUserID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	return s.store.Reports.GetInstructorIDByUserID(ctx, userID)
}

func (s *ReportService) GetInstructorStudentCountKPI(ctx context.Context, instructorID uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetInstructorStudentCountKPI(ctx, instructorID)
}

func (s *ReportService) GetInstructorMonthlyClassesCount(ctx context.Context, instructorID uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetInstructorMonthlyClassesCount(ctx, instructorID)
}

func (s *ReportService) GetInstructorClassesToday(ctx context.Context, instructorID uuid.UUID) ([]reportdomain.ClassScheduleItem, error) {
	return s.store.Reports.GetInstructorClassesToday(ctx, instructorID)
}

func (s *ReportService) GetWeeklyRevenueKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetWeeklyRevenueKPI(ctx, branchID)
}

func (s *ReportService) GetAverageTicketKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetAverageTicketKPI(ctx, branchID)
}

func (s *ReportService) GetAccountsReceivableKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetAccountsReceivableKPI(ctx, branchID)
}

func (s *ReportService) GetMonthlyRecurringRevenueKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetMonthlyRecurringRevenueKPI(ctx, branchID)
}

func (s *ReportService) GetMonthlyRevenueChart(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetMonthlyRevenueChart(ctx, branchID)
}

func (s *ReportService) GetBillingByBranchMatrix(ctx context.Context, start, end time.Time) (*reportdomain.BillingMatrix, error) {
	return s.store.Reports.GetBillingByBranchMatrix(ctx, start, end)
}

func (s *ReportService) GetTotalTransactions(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetTotalTransactions(ctx, branchID)
}

func (s *ReportService) GetNewClientsKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetNewClientsKPI(ctx, branchID)
}

func (s *ReportService) GetRetentionRateKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetRetentionRateKPI(ctx, branchID)
}

func (s *ReportService) GetAverageCLVKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetAverageCLVKPI(ctx, branchID)
}

func (s *ReportService) GetNewVsRecurringChart(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.StackedChartData, error) {
	return s.store.Reports.GetNewVsRecurringChart(ctx, branchID)
}

func (s *ReportService) GetCohortAnalysis(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.CohortRetention, error) {
	return s.store.Reports.GetCohortAnalysis(ctx, branchID)
}

func (s *ReportService) GetMonthlyCashFlowChart(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetMonthlyCashFlowChart(ctx, branchID)
}

func (s *ReportService) GetSalesByDemographics(ctx context.Context, branchID *uuid.UUID, start, end time.Time, dimension string) ([]reportdomain.ChartData, error) {
	return s.store.Reports.GetSalesByDemographics(ctx, branchID, start, end, dimension)
}

// CalculateChurnRisk scores a client 0-100 from absence, attendance trend and
// upcoming membership expiration. >= 70 is considered high risk.
func CalculateChurnRisk(m reportdomain.ClientChurnMetrics) (int, []string) {
	riskScore := 0
	var factors []string

	daysSinceCheckIn := 30.0 // Default high if never checked in
	if m.LastCheckIn != nil {
		daysSinceCheckIn = time.Since(*m.LastCheckIn).Hours() / 24
	}

	if daysSinceCheckIn > 14 {
		riskScore += 40
		factors = append(factors, "Absent > 14 days")
	}

	// B. Trend Factor: Visits this month vs last month
	if m.LastMonthVisits > 0 {
		if float64(m.CurrentMonthVisits) < float64(m.LastMonthVisits)*0.5 {
			riskScore += 30
			factors = append(factors, "Attendance drop > 50%")
		}
	}

	// C. Expiration Factor: Membership expiring soon
	if m.MembershipEndDate != nil {
		daysUntilExpiration := time.Until(*m.MembershipEndDate).Hours() / 24
		if daysUntilExpiration > 0 && daysUntilExpiration < 5 {
			riskScore += 30
			factors = append(factors, "Membership expires < 5 days")
		}
	}
	return riskScore, factors
}

// ListChurnRisk returns clients whose churn risk score is >= minScore, highest
// risk first, optionally restricted to a preferred branch (HU-ANALYTICS-20).
func (s *ReportService) ListChurnRisk(ctx context.Context, branchID *uuid.UUID, minScore int) ([]reportdomain.ChurnRiskAnalysis, error) {
	metrics, err := s.store.Reports.GetClientsChurnMetrics(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]reportdomain.ChurnRiskAnalysis, 0)
	for _, m := range metrics {
		if branchID != nil && (m.PreferredBranchID == nil || *m.PreferredBranchID != *branchID) {
			continue
		}
		score, factors := CalculateChurnRisk(m)
		if score < minScore {
			continue
		}
		result = append(result, reportdomain.ChurnRiskAnalysis{
			UserID:            m.UserID,
			Name:              m.FirstName + " " + m.LastName,
			Email:             m.Email,
			Phone:             m.Phone,
			RiskScore:         score,
			Factors:           factors,
			PreferredBranchID: m.PreferredBranchID,
		})
	}
	sort.SliceStable(result, func(i, j int) bool { return result[i].RiskScore > result[j].RiskScore })
	return result, nil
}

func (s *ReportService) DetectAndFlagChurnRisk(ctx context.Context) ([]reportdomain.ChurnRiskAnalysis, []reportdomain.ChurnRiskAnalysis, error) {
	// 1. Get historical data for all active clients
	metrics, err := s.store.Reports.GetClientsChurnMetrics(ctx)
	if err != nil {
		return nil, nil, err
	}

	// 2. Get Managers for all branches to identify who to notify
	managersMap, err := s.store.Reports.GetBranchManagers(ctx)
	if err != nil {
		return nil, nil, err
	}

	var newlyDetected []reportdomain.ChurnRiskAnalysis
	var allAtRisk []reportdomain.ChurnRiskAnalysis

	for _, m := range metrics {
		riskScore, factors := CalculateChurnRisk(m)

		// Action 1: Flag High Risk Users
		if riskScore >= 70 {
			analysis := reportdomain.ChurnRiskAnalysis{
				UserID:            m.UserID,
				Name:              m.FirstName + " " + m.LastName,
				Email:             m.Email,
				Phone:             m.Phone,
				RiskScore:         riskScore,
				Factors:           factors,
				PreferredBranchID: m.PreferredBranchID,
			}

			if m.PreferredBranchID != nil {
				if manager, ok := managersMap[*m.PreferredBranchID]; ok {
					analysis.ManagerID = &manager.UserID
					analysis.ManagerEmail = manager.Email
				}
			}

			// Only update if not already AtRisk to avoid redundant DB writes
			if m.CurrentCategory != string(authdomain.ClientCategoryAtRisk) {
				_ = s.store.Users.UpdateClientCategory(ctx, m.UserID, authdomain.ClientCategoryAtRisk)
				newlyDetected = append(newlyDetected, analysis)
			}

			allAtRisk = append(allAtRisk, analysis)
		} else {
			if m.CurrentCategory == string(authdomain.ClientCategoryAtRisk) {
				newCategory := authdomain.ClientCategoryRegular
				_ = s.store.Users.UpdateClientCategory(ctx, m.UserID, newCategory)
			}
		}
	}

	return newlyDetected, allAtRisk, nil
}

func (s *ReportService) GetChurnRateKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	return s.store.Reports.GetChurnRateKPI(ctx, branchID)
}

func (s *ReportService) GetFinancialReportData(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]reportdomain.FinancialReportRow, error) {
	return s.store.Reports.GetFinancialReportData(ctx, branchID, start, end)
}

func (s *ReportService) GetClientReportData(ctx context.Context) ([]reportdomain.ClientChurnMetrics, error) {
	return s.store.Reports.GetClientsChurnMetrics(ctx)
}

func (s *ReportService) GetSalesReportData(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]reportdomain.SalesReportRow, error) {
	return s.store.Reports.GetSalesReportData(ctx, branchID, start, end)
}

func (s *ReportService) GetRFMAnalysis(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.RFMMetric, error) {
	data, err := s.store.Reports.GetRFMData(ctx, branchID)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return data, nil
	}

	// 1. Calculate Recency Days
	now := time.Now()
	for i := range data {
		if data[i].LastPurchase != nil {
			diff := now.Sub(*data[i].LastPurchase).Hours() / 24
			data[i].RecencyDays = int(diff)
		} else {
			data[i].RecencyDays = 999 // Never purchased
		}
	}

	// Helper to assign scores (1-5) based on quintiles
	assignScore := func(metrics []reportdomain.RFMMetric, getValue func(int) float64, setScore func(int, int), descending bool) {
		n := len(metrics)
		// Create a slice of indices to sort
		indices := make([]int, n)
		for i := 0; i < n; i++ {
			indices[i] = i
		}

		sort.Slice(indices, func(i, j int) bool {
			valI := getValue(indices[i])
			valJ := getValue(indices[j])
			if descending {
				return valI > valJ // Higher value = Better rank (e.g. Monetary, Frequency)
			}
			return valI < valJ // Lower value = Better rank (e.g. Recency)
		})

		// Assign scores 5 to 1 based on quintiles
		for rank, idx := range indices {
			percentile := float64(rank) / float64(n)
			score := 5 - int(math.Floor(percentile*5))
			if score < 1 {
				score = 1
			}
			setScore(idx, score)
		}
	}

	// 2. Calculate Scores
	// Recency (Lower is better -> Descending=false)
	assignScore(data, func(i int) float64 { return float64(data[i].RecencyDays) }, func(i, score int) { data[i].RScore = score }, false)

	// Frequency (Higher is better -> Descending=true)
	assignScore(data, func(i int) float64 { return float64(data[i].Frequency) }, func(i, score int) { data[i].FScore = score }, true)

	// Monetary (Higher is better -> Descending=true)
	assignScore(data, func(i int) float64 { val, _ := data[i].MonetaryTotal.Float64(); return val }, func(i, score int) { data[i].MScore = score }, true)

	// 3. Assign Segments
	for i := range data {
		r, f, m := data[i].RScore, data[i].FScore, data[i].MScore
		avgFM := float64(f+m) / 2.0

		if r >= 4 && avgFM >= 4 {
			data[i].Segment = "Champions"
		} else if r >= 3 && avgFM >= 3 {
			data[i].Segment = "Loyal Customers"
		} else if r >= 4 && avgFM <= 2 {
			data[i].Segment = "New Customers" // High recency, low frequency/monetary
		} else if r <= 2 && avgFM >= 4 {
			data[i].Segment = "At Risk" // Good past customers, haven't bought recently
		} else if r <= 2 && avgFM <= 2 {
			data[i].Segment = "Lost"
		} else if r == 3 && avgFM <= 3 {
			data[i].Segment = "Potential Loyalist"
		} else {
			data[i].Segment = "Regular"
		}

		// Override for non-purchasers
		if data[i].Frequency == 0 {
			data[i].Segment = "New / Non-Purchaser"
		}
	}

	return data, nil
}
