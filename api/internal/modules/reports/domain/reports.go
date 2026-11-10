package reportdomain

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type GlobalSalesStats struct {
	TotalCurrentMonth decimal.Decimal `json:"total_current_month"`
	TotalLastMonth    decimal.Decimal `json:"total_last_month"`
	PercentageChange  float64         `json:"percentage_change"`
	Trend             string          `json:"trend"`
}

type TotalSalesStats struct {
	TotalSales       decimal.Decimal `json:"total_sales"`
	PercentageChange float64         `json:"percentage_change"`
	Trend            string          `json:"trend"`
}

type BranchPerformance struct {
	Label         string          `json:"label"`
	Value         decimal.Decimal `json:"value"`
	PercentChange float64         `json:"percent_change"`
	Status        string          `json:"status"`
	Trend         string          `json:"trend"`
}

type ChartData struct {
	Label string          `json:"label"`
	Value decimal.Decimal `json:"value"`
	Hour  int             `json:"hour,omitempty"`
}

type KPICard struct {
	Title        string          `json:"title"`
	Value        decimal.Decimal `json:"value"`
	TrendPercent float64         `json:"trend_percent"`
	TrendLabel   string          `json:"trend_label"`
	IsPositive   bool            `json:"is_positive"`
	Target       decimal.Decimal `json:"target,omitempty"`
}

type HeatmapPoint struct {
	DayOfWeek int   `json:"day_of_week"` // 1=Monday, 7=Sunday
	Hour      int   `json:"hour"`        // Start hour of the bucket (0, 3, 6...)
	Value     int64 `json:"value"`
}

type FinancialSummaryItem struct {
	Category string          `json:"category"`
	Amount   decimal.Decimal `json:"amount"`
}

type FinancialSummary struct {
	Items []FinancialSummaryItem `json:"items"`
	Total decimal.Decimal        `json:"total"`
}

type ClassCapacityStats struct {
	ClassName    string `json:"class_name"`
	CurrentCount int64  `json:"current_count"`
	MaxCapacity  int    `json:"max_capacity"`
	Ratio        string `json:"ratio"` // "X / Y"
}

type ClassScheduleItem struct {
	ClassID        uuid.UUID `json:"class_id"`
	ClassName      string    `json:"class_name"`
	InstructorName string    `json:"instructor_name"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	MaxCapacity    int       `json:"max_capacity"`
}

type RecentAttendanceItem struct {
	UserName    string    `json:"user_name"`
	CheckInTime time.Time `json:"check_in_time"`
	ServiceName string    `json:"service_name"`
}

type BillingMatrixRow struct {
	Concept string                     `json:"concept"`
	Values  map[string]decimal.Decimal `json:"values"` // BranchName -> Amount
	Total   decimal.Decimal            `json:"total"`  // Global Total for this concept
}

type BillingMatrix struct {
	Branches   []string                   `json:"branches"`    // List of branch names (columns)
	Rows       []BillingMatrixRow         `json:"rows"`        // Data rows
	Totals     map[string]decimal.Decimal `json:"totals"`      // BranchName -> Total Vertical
	GrandTotal decimal.Decimal            `json:"grand_total"` // Total of Totals
}

type StackedChartData struct {
	Label     string `json:"label"`     // Month Name
	New       int64  `json:"new"`       // Registered this month
	Recurring int64  `json:"recurring"` // Active this month but registered previously
}

type CohortRetention struct {
	CohortMonth string    `json:"cohort_month"` // e.g., "Jan 2024"
	CohortSize  int64     `json:"cohort_size"`  // Total users in cohort
	Retention   []float64 `json:"retention"`    // Percentage for Month 0, 1, 2...
}

type ClientChurnMetrics struct {
	UserID             uuid.UUID  `json:"user_id"`
	FirstName          string     `json:"first_name"`
	LastName           string     `json:"last_name"`
	Email              string     `json:"email"`
	Phone              string     `json:"phone"`
	LastCheckIn        *time.Time `json:"last_check_in"`
	CurrentMonthVisits int64      `json:"current_month_visits"`
	LastMonthVisits    int64      `json:"last_month_visits"`
	MembershipEndDate  *time.Time `json:"membership_end_date"`
	PreferredBranchID  *uuid.UUID `json:"preferred_branch_id"`
	CurrentCategory    string     `json:"current_category"`
}

type ChurnRiskAnalysis struct {
	UserID            uuid.UUID  `json:"user_id"`
	Name              string     `json:"name"`
	Email             string     `json:"email"`
	Phone             string     `json:"phone"`
	RiskScore         int        `json:"risk_score"`
	Factors           []string   `json:"factors"`
	PreferredBranchID *uuid.UUID `json:"preferred_branch_id"`
	ManagerID         *uuid.UUID `json:"manager_id"`
	ManagerEmail      string     `json:"manager_email"`
}

type BranchManagerDetails struct {
	BranchID uuid.UUID `json:"branch_id"`
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Name     string    `json:"name"`
}

type FinancialReportRow struct {
	Date       time.Time       `json:"date"`
	BranchName string          `json:"branch_name"`
	ClientName string          `json:"client_name"`
	Category   string          `json:"category"`
	Concept    string          `json:"concept"`
	Amount     decimal.Decimal `json:"amount"`
	Status     string          `json:"status"`
}

type SalesReportRow struct {
	Date          time.Time       `json:"date"`
	BranchName    string          `json:"branch_name"`
	ItemName      string          `json:"item_name"`
	Category      string          `json:"category"`
	Quantity      int             `json:"quantity"`
	Total         decimal.Decimal `json:"total"`
	PaymentMethod string          `json:"payment_method"`
}

type RFMMetric struct {
	UserID        uuid.UUID       `json:"user_id"`
	Name          string          `json:"name"`
	Email         string          `json:"email"`
	LastPurchase  *time.Time      `json:"last_purchase"`
	RecencyDays   int             `json:"recency_days"`
	Frequency     int             `json:"frequency"`
	MonetaryTotal decimal.Decimal `json:"monetary_total"`
	RScore        int             `json:"r_score"`
	FScore        int             `json:"f_score"`
	MScore        int             `json:"m_score"`
	Segment       string          `json:"segment"`
}
