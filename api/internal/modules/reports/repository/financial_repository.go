package reportrepository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	reportdomain "github.com/vitalfit/api/internal/modules/reports/domain"
	"gorm.io/gorm"
)

func (rs *ReportStore) GetWeeklyRevenueKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	now := time.Now()

	offset := int(now.Weekday())
	if offset == 0 {
		offset = 7
	}
	offset--
	startOfWeek := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -offset)
	startOfPrevWeek := startOfWeek.AddDate(0, 0, -7)

	var currentTotal, prevTotal decimal.Decimal

	queryCurrent := rs.db.WithContext(ctx).Table("payments p").
		Joins("JOIN invoices i ON i.invoice_id = p.invoice_id").
		Where("p.payment_date >= ?", startOfWeek).
		Where("p.status = ?", billingdomain.PaymentStatusCompleted)

	if branchID != nil {
		queryCurrent = queryCurrent.Where("i.branch_id = ?", *branchID)
	}

	if err := queryCurrent.Select("COALESCE(SUM(p.amount_base), 0)").Scan(&currentTotal).Error; err != nil {
		return nil, err
	}

	queryPrev := rs.db.WithContext(ctx).Table("payments p").
		Joins("JOIN invoices i ON i.invoice_id = p.invoice_id").
		Where("p.payment_date >= ? AND p.payment_date < ?", startOfPrevWeek, startOfWeek).
		Where("p.status = ?", billingdomain.PaymentStatusCompleted)

	if branchID != nil {
		queryPrev = queryPrev.Where("i.branch_id = ?", *branchID)
	}

	if err := queryPrev.Select("COALESCE(SUM(p.amount_base), 0)").Scan(&prevTotal).Error; err != nil {
		return nil, err
	}

	return calculateTrend(currentTotal, prevTotal, "Weekly Revenue", "vs previous week")
}

func (rs *ReportStore) GetAverageTicketKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	now := time.Now()
	currentMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	prevMonthStart := currentMonthStart.AddDate(0, -1, 0)

	calcAvg := func(start time.Time, end *time.Time) (decimal.Decimal, error) {
		var result struct {
			Total decimal.Decimal
			Count int64
		}

		query := rs.db.WithContext(ctx).Model(&billingdomain.Invoice{}).
			Where("issue_date >= ? AND status = ?", start, billingdomain.InvoiceStatusPaid)

		if end != nil {
			query = query.Where("issue_date < ?", end)
		}

		if branchID != nil {
			query = query.Where("branch_id = ?", *branchID)
		}

		err := query.Select("COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count").Scan(&result).Error
		if err != nil {
			return decimal.Zero, err
		}

		if result.Count == 0 {
			return decimal.Zero, nil
		}
		return result.Total.Div(decimal.NewFromInt(result.Count)), nil
	}

	currentAvg, err := calcAvg(currentMonthStart, nil)
	if err != nil {
		return nil, err
	}

	prevAvg, err := calcAvg(prevMonthStart, &currentMonthStart)
	if err != nil {
		return nil, err
	}

	return calculateTrend(currentAvg, prevAvg, "Average Ticket", "vs previous month")
}

func (rs *ReportStore) GetAccountsReceivableKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	var totalDebt decimal.Decimal

	query := rs.db.WithContext(ctx).Table("invoices i").
		Select("COALESCE(SUM(i.total_amount - COALESCE(paid_sum.paid, 0)), 0)").
		Joins("JOIN users u ON u.user_id = i.user_id").
		Joins(`LEFT JOIN (
			SELECT invoice_id, SUM(amount_base) as paid 
			FROM payments 
			WHERE status = ? 
			GROUP BY invoice_id
		) paid_sum ON paid_sum.invoice_id = i.invoice_id`, billingdomain.PaymentStatusCompleted).
		Where("i.status IN ?", []billingdomain.InvoiceStatus{billingdomain.InvoiceStatusUnpaid, billingdomain.InvoiceStatusOverdue}).
		Where("u.deleted_at IS NULL")

	if branchID != nil {
		query = query.Where("i.branch_id = ?", *branchID)
	}

	if err := query.Scan(&totalDebt).Error; err != nil {
		return nil, err
	}

	return &reportdomain.KPICard{
		Title:      "Accounts Receivable",
		Value:      totalDebt,
		TrendLabel: "Total Outstanding Debt",
	}, nil
}

func (rs *ReportStore) GetMonthlyRecurringRevenueKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	now := time.Now()
	currentMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	prevMonthStart := currentMonthStart.AddDate(0, -1, 0)

	calcMRR := func(start time.Time, end *time.Time) (decimal.Decimal, error) {
		var total decimal.Decimal
		query := rs.db.WithContext(ctx).Table("invoice_items ii").
			Joins("JOIN invoices i ON i.invoice_id = ii.invoice_id").
			Where("i.issue_date >= ? AND i.status = ?", start, billingdomain.InvoiceStatusPaid).
			Where("ii.membership_type_id IS NOT NULL") // Filtro clave para MRR: Solo membresías

		if end != nil {
			query = query.Where("i.issue_date < ?", end)
		}

		if branchID != nil {
			query = query.Where("i.branch_id = ?", *branchID)
		}

		err := query.Select("COALESCE(SUM(ii.total_line), 0)").Scan(&total).Error
		return total, err
	}

	currentMRR, err := calcMRR(currentMonthStart, nil)
	if err != nil {
		return nil, err
	}

	prevMRR, err := calcMRR(prevMonthStart, &currentMonthStart)
	if err != nil {
		return nil, err
	}

	return calculateTrend(currentMRR, prevMRR, "MRR (Memberships)", "vs previous month")
}

func (rs *ReportStore) GetBillingByBranchMatrix(ctx context.Context, start, end time.Time) (*reportdomain.BillingMatrix, error) {
	type queryResult struct {
		BranchName string          `gorm:"column:branch_name"`
		Category   string          `gorm:"column:category"`
		Amount     decimal.Decimal `gorm:"column:amount"`
	}

	var results []queryResult

	err := rs.db.WithContext(ctx).Table("invoice_items ii").
		Select(`
			b.name as branch_name,
			CASE 
				WHEN ii.membership_type_id IS NOT NULL THEN 'Memberships'
				WHEN ii.service_id IS NOT NULL THEN 'Services'
				WHEN ii.package_id IS NOT NULL THEN 'Combos'
				ELSE 'Other'
			END as category,
			COALESCE(SUM(ii.total_line), 0) as amount
		`).
		Joins("JOIN invoices i ON i.invoice_id = ii.invoice_id").
		Joins("JOIN branch b ON b.branch_id = i.branch_id").
		Where("i.status = ?", billingdomain.InvoiceStatusPaid).
		Where("i.issue_date BETWEEN ? AND ?", start, end).
		Group("b.name, category").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	matrix := &reportdomain.BillingMatrix{
		Branches:   []string{},
		Rows:       []reportdomain.BillingMatrixRow{},
		Totals:     make(map[string]decimal.Decimal),
		GrandTotal: decimal.Zero,
	}

	concepts := []string{"Memberships", "Services", "Combos", "Other"}
	rowsMap := make(map[string]*reportdomain.BillingMatrixRow)
	branchesSet := make(map[string]bool)

	for _, c := range concepts {
		rowsMap[c] = &reportdomain.BillingMatrixRow{
			Concept: c,
			Values:  make(map[string]decimal.Decimal),
			Total:   decimal.Zero,
		}
	}

	for _, r := range results {
		if !branchesSet[r.BranchName] {
			branchesSet[r.BranchName] = true
			matrix.Branches = append(matrix.Branches, r.BranchName)
			matrix.Totals[r.BranchName] = decimal.Zero
		}

		row := rowsMap[r.Category]
		row.Values[r.BranchName] = r.Amount
		row.Total = row.Total.Add(r.Amount)

		matrix.Totals[r.BranchName] = matrix.Totals[r.BranchName].Add(r.Amount)
		matrix.GrandTotal = matrix.GrandTotal.Add(r.Amount)
	}

	for _, c := range concepts {
		matrix.Rows = append(matrix.Rows, *rowsMap[c])
	}

	return matrix, nil
}

func (rs *ReportStore) GetTotalTransactions(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	var totalLifetime, currentCount, prevCount int64
	now := time.Now()
	currentMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	prevMonthStart := currentMonthStart.AddDate(0, -1, 0)

	// Base query builder
	buildQuery := func() *gorm.DB {
		query := rs.db.WithContext(ctx).Model(&billingdomain.Payment{}).
			Joins("JOIN invoices i ON i.invoice_id = payments.invoice_id").
			Where("payments.status = ?", billingdomain.PaymentStatusCompleted)

		if branchID != nil {
			query = query.Where("i.branch_id = ?", *branchID)
		}
		return query
	}

	if err := buildQuery().Count(&totalLifetime).Error; err != nil {
		return nil, err
	}

	if err := buildQuery().Where("payments.payment_date >= ?", currentMonthStart).Count(&currentCount).Error; err != nil {
		return nil, err
	}

	if err := buildQuery().Where("payments.payment_date >= ? AND payments.payment_date < ?", prevMonthStart, currentMonthStart).Count(&prevCount).Error; err != nil {
		return nil, err
	}

	percentageChange := 0.0

	if prevCount > 0 {
		percentageChange = float64(currentCount-prevCount) / float64(prevCount) * 100
	} else if currentCount > 0 {
		percentageChange = 100.0
	}

	return &reportdomain.KPICard{
		Title:        "Total Transactions",
		Value:        decimal.NewFromInt(totalLifetime),
		TrendPercent: percentageChange,
		TrendLabel:   "vs previous month",
		IsPositive:   percentageChange >= 0,
	}, nil
}

func (rs *ReportStore) GetAverageCLVKPI(ctx context.Context, branchID *uuid.UUID) (*reportdomain.KPICard, error) {
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	calcCLV := func(dateLimit time.Time) (decimal.Decimal, error) {
		var totalRevenue decimal.Decimal
		var totalCustomers int64

		queryRev := rs.db.WithContext(ctx).Model(&billingdomain.Invoice{}).
			Where("issue_date <= ? AND status = ?", dateLimit, billingdomain.InvoiceStatusPaid)

		if branchID != nil {
			queryRev = queryRev.Where("branch_id = ?", *branchID)
		}

		if err := queryRev.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue).Error; err != nil {
			return decimal.Zero, err
		}

		queryCust := rs.db.WithContext(ctx).Model(&billingdomain.Invoice{}).
			Where("issue_date <= ? AND status = ?", dateLimit, billingdomain.InvoiceStatusPaid)

		if branchID != nil {
			queryCust = queryCust.Where("branch_id = ?", *branchID)
		}

		if err := queryCust.Distinct("user_id").Count(&totalCustomers).Error; err != nil {
			return decimal.Zero, err
		}

		if totalCustomers == 0 {
			return decimal.Zero, nil
		}

		return totalRevenue.Div(decimal.NewFromInt(totalCustomers)), nil
	}

	currentCLV, err := calcCLV(now)
	if err != nil {
		return nil, err
	}

	prevCLV, err := calcCLV(thirtyDaysAgo)
	if err != nil {
		return nil, err
	}

	return calculateTrend(currentCLV, prevCLV, "Average CLV", "vs 30 days ago")
}

func (rs *ReportStore) GetMonthlyCashFlowChart(ctx context.Context, branchID *uuid.UUID) ([]reportdomain.ChartData, error) {
	now := time.Now()
	startOfYear := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	endOfYear := time.Date(now.Year(), 12, 31, 23, 59, 59, 999999999, now.Location())

	type result struct {
		Month int             `gorm:"column:month"`
		Total decimal.Decimal `gorm:"column:total"`
	}

	var queryResults []result

	query := rs.db.WithContext(ctx).Table("payments p").
		Select("EXTRACT(MONTH FROM p.payment_date) as month, COALESCE(SUM(p.amount_base), 0) as total").
		Joins("JOIN invoices i ON i.invoice_id = p.invoice_id").
		Where("p.payment_date BETWEEN ? AND ?", startOfYear, endOfYear).
		Where("p.status = ?", billingdomain.PaymentStatusCompleted)

	if branchID != nil {
		query = query.Where("i.branch_id = ?", *branchID)
	}

	err := query.Group("EXTRACT(MONTH FROM p.payment_date)").Scan(&queryResults).Error
	if err != nil {
		return nil, err
	}

	chartData := make([]reportdomain.ChartData, 12)
	months := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}

	resultsMap := make(map[int]decimal.Decimal)
	for _, r := range queryResults {
		resultsMap[r.Month] = r.Total
	}

	for i := 0; i < 12; i++ {
		val := resultsMap[i+1]
		chartData[i] = reportdomain.ChartData{Label: months[i], Value: val}
	}

	return chartData, nil
}

func calculateTrend(current, prev decimal.Decimal, title, label string) (*reportdomain.KPICard, error) {
	percentageChange := 0.0
	if !prev.IsZero() {
		diff := current.Sub(prev)
		percentageChange, _ = diff.Div(prev).Mul(decimal.NewFromInt(100)).Float64()
	} else if !current.IsZero() {
		percentageChange = 100.0
	}

	return &reportdomain.KPICard{
		Title:        title,
		Value:        current,
		TrendPercent: percentageChange,
		TrendLabel:   label,
		IsPositive:   percentageChange >= 0,
	}, nil
}

func (rs *ReportStore) GetFinancialReportData(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]reportdomain.FinancialReportRow, error) {
	var results []reportdomain.FinancialReportRow

	query := rs.db.WithContext(ctx).Table("invoice_items ii").
		Select(`
			i.issue_date as date,
			b.name as branch_name,
			CONCAT(u.first_name, ' ', u.last_name) as client_name,
			CASE 
				WHEN ii.membership_type_id IS NOT NULL THEN 'Memberships'
				WHEN ii.service_id IS NOT NULL THEN 'Services'
				WHEN ii.package_id IS NOT NULL THEN 'Combos'
				ELSE 'Other'
			END as category,
			COALESCE(mt.name, s.name, p.name, 'Item') as concept,
			ii.total_line as amount,
			i.status as status
		`).
		Joins("JOIN invoices i ON i.invoice_id = ii.invoice_id").
		Joins("JOIN branch b ON b.branch_id = i.branch_id").
		Joins("JOIN users u ON u.user_id = i.user_id").
		Joins("LEFT JOIN membership_types mt ON mt.membership_type_id = ii.membership_type_id").
		Joins("LEFT JOIN services s ON s.service_id = ii.service_id").
		Joins("LEFT JOIN packages p ON p.package_id = ii.package_id").
		Where("i.issue_date BETWEEN ? AND ?", start, end)

	if branchID != nil {
		query = query.Where("i.branch_id = ?", *branchID)
	}

	err := query.Order("i.issue_date DESC").Scan(&results).Error
	return results, err
}

func (rs *ReportStore) GetSalesReportData(ctx context.Context, branchID *uuid.UUID, start, end time.Time) ([]reportdomain.SalesReportRow, error) {
	var results []reportdomain.SalesReportRow

	query := rs.db.WithContext(ctx).Table("invoice_items ii").
		Select(`
			i.issue_date as date,
			b.name as branch_name,
			COALESCE(s.name, p.name, mt.name, 'Other') as item_name,
			CASE 
				WHEN ii.membership_type_id IS NOT NULL THEN 'Memberships'
				WHEN ii.service_id IS NOT NULL THEN 'Services'
				WHEN ii.package_id IS NOT NULL THEN 'Combos'
				ELSE 'Other'
			END as category,
			ii.quantity,
			ii.total_line as total,
			COALESCE(pm_agg.methods, 'Pending/Unpaid') as payment_method
		`).
		Joins("JOIN invoices i ON i.invoice_id = ii.invoice_id").
		Joins("JOIN branch b ON b.branch_id = i.branch_id").
		Joins("LEFT JOIN services s ON s.service_id = ii.service_id").
		Joins("LEFT JOIN packages p ON p.package_id = ii.package_id").
		Joins("LEFT JOIN membership_types mt ON mt.membership_type_id = ii.membership_type_id").
		Joins(`LEFT JOIN (
			SELECT 
				p.invoice_id, 
				STRING_AGG(DISTINCT pm.name, ', ') as methods
			FROM payments p
			JOIN payment_methods pm ON p.payment_method_id = pm.method_id
			WHERE p.status = 'Completed'
			GROUP BY p.invoice_id
		) pm_agg ON pm_agg.invoice_id = i.invoice_id`).
		Where("i.issue_date BETWEEN ? AND ?", start, end)

	if branchID != nil {
		query = query.Where("i.branch_id = ?", *branchID)
	}

	err := query.Order("i.issue_date DESC").Scan(&results).Error
	return results, err
}
