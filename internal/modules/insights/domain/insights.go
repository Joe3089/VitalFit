package insightsdomain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

var (
	ErrInvalidReportType = errors.New("invalid report type")
	ErrInvalidFormat     = errors.New("invalid format, use csv, excel or pdf")
	ErrLinkExpired       = errors.New("the shared link has expired")
)

// ---------------- Persistence models ----------------

type ReportTemplate struct {
	TemplateID   uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"template_id"`
	Name         string    `gorm:"type:varchar(120);not null;unique" json:"name"`
	PrimaryColor string    `gorm:"type:varchar(20);not null" json:"primary_color"`
	HeaderText   string    `gorm:"type:varchar(255);not null" json:"header_text"`
	FooterText   string    `gorm:"type:varchar(255);not null" json:"footer_text"`
	Orientation  string    `gorm:"type:varchar(1);not null" json:"orientation"`
	IsDefault    bool      `gorm:"not null;default:false" json:"is_default"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (ReportTemplate) TableName() string { return "report_templates" }

func DefaultTemplate() ReportTemplate {
	return ReportTemplate{Name: "VitalFit", PrimaryColor: "#f58a24", HeaderText: "VitalFit", Orientation: "L"}
}

type ReportSchedule struct {
	ScheduleID uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"schedule_id"`
	Name       string         `gorm:"type:varchar(120);not null" json:"name"`
	ReportType string         `gorm:"type:varchar(20);not null" json:"report_type"`
	Format     string         `gorm:"type:varchar(10);not null" json:"format"`
	Frequency  string         `gorm:"type:varchar(10);not null" json:"frequency"`
	Recipients pq.StringArray `gorm:"type:text[];not null" json:"recipients" swaggertype:"array,string"`
	BranchID   *uuid.UUID     `gorm:"type:uuid" json:"branch_id"`
	TemplateID *uuid.UUID     `gorm:"type:uuid" json:"template_id"`
	IsActive   bool           `gorm:"not null;default:true" json:"is_active"`
	LastSentAt *time.Time     `json:"last_sent_at"`
	CreatedBy  *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

func (ReportSchedule) TableName() string { return "report_schedules" }

type ReportShareLink struct {
	TokenHash   string     `gorm:"type:varchar(64);primaryKey" json:"link_id"`
	ReportType  string     `gorm:"type:varchar(20);not null" json:"report_type"`
	Format      string     `gorm:"type:varchar(10);not null" json:"format"`
	BranchID    *uuid.UUID `gorm:"type:uuid" json:"branch_id"`
	TemplateID  *uuid.UUID `gorm:"type:uuid" json:"template_id"`
	PeriodStart time.Time  `gorm:"type:date;not null" json:"period_start"`
	PeriodEnd   time.Time  `gorm:"type:date;not null" json:"period_end"`
	ExpiresAt   time.Time  `json:"expires_at"`
	AccessCount int        `gorm:"not null;default:0" json:"access_count"`
	CreatedBy   *uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (ReportShareLink) TableName() string { return "report_share_links" }

type BIAPIKey struct {
	KeyID      uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"key_id"`
	Name       string     `gorm:"type:varchar(120);not null" json:"name"`
	KeyPrefix  string     `gorm:"type:varchar(12);not null" json:"key_prefix"`
	KeyHash    string     `gorm:"type:varchar(64);not null;unique" json:"-"`
	CreatedBy  *uuid.UUID `gorm:"type:uuid" json:"created_by"`
	LastUsedAt *time.Time `json:"last_used_at"`
	ExpiresAt  *time.Time `json:"expires_at"`
	RevokedAt  *time.Time `json:"revoked_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (BIAPIKey) TableName() string { return "bi_api_keys" }

type KPIAlert struct {
	AlertID        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"alert_id"`
	BranchID       *uuid.UUID `gorm:"type:uuid" json:"branch_id"`
	BranchName     string     `gorm:"->;-:migration" json:"branch_name"`
	Metric         string     `gorm:"type:varchar(50);not null" json:"metric"`
	Severity       string     `gorm:"type:varchar(10);not null" json:"severity"`
	Message        string     `gorm:"type:text;not null" json:"message"`
	ObservedValue  float64    `json:"observed_value"`
	ExpectedValue  float64    `json:"expected_value"`
	ZScore         float64    `gorm:"column:z_score" json:"z_score"`
	AlertDate      time.Time  `gorm:"type:date" json:"alert_date"`
	AcknowledgedAt *time.Time `json:"acknowledged_at"`
	AcknowledgedBy *uuid.UUID `gorm:"type:uuid" json:"acknowledged_by"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (KPIAlert) TableName() string { return "kpi_alerts" }

// ---------------- Analytics DTOs ----------------

type DateRange struct {
	Start time.Time
	End   time.Time // exclusive
}

type ConversionDay struct {
	Day       time.Time `json:"day"`
	Visitors  int64     `json:"visitors"`
	Signups   int64     `json:"signups"`
	Purchases int64     `json:"purchases"`
}

type ConversionStats struct {
	Visitors       int64           `json:"visitors"`
	Signups        int64           `json:"signups"`
	Checkouts      int64           `json:"checkouts"`
	Purchases      int64           `json:"purchases"`
	SignupRate     float64         `json:"signup_rate"`
	ConversionRate float64         `json:"conversion_rate"`
	Daily          []ConversionDay `gorm:"-" json:"daily"`
}

type NPSBranch struct {
	BranchID   *uuid.UUID `json:"branch_id"`
	BranchName string     `json:"branch_name"`
	Responses  int64      `json:"responses"`
	Promoters  int64      `json:"promoters"`
	Passives   int64      `json:"passives"`
	Detractors int64      `json:"detractors"`
	Average    float64    `json:"average_score"`
	NPS        float64    `json:"nps"`
}

type NPSSummary struct {
	NPSBranch
	ByBranch []NPSBranch     `json:"by_branch"`
	Recent   []NPSComment    `json:"recent_comments"`
	Monthly  []NPSMonthPoint `json:"monthly"`
}

type NPSComment struct {
	Score      int       `json:"score"`
	Comment    string    `json:"comment"`
	BranchName string    `json:"branch_name"`
	CreatedAt  time.Time `json:"created_at"`
}

type NPSMonthPoint struct {
	Month      string  `json:"month"`
	Responses  int64   `json:"responses"`
	Promoters  int64   `json:"promoters"`
	Detractors int64   `json:"detractors"`
	NPS        float64 `json:"nps"`
}

type RevPASRow struct {
	BranchID        uuid.UUID `json:"branch_id"`
	BranchName      string    `json:"branch_name"`
	ServiceID       *string   `json:"service_id,omitempty"`
	ServiceName     string    `json:"service_name,omitempty"`
	Revenue         float64   `json:"revenue"`
	AvailableSpaces int64     `json:"available_spaces"`
	BookedSpaces    int64     `json:"booked_spaces"`
	Occupancy       float64   `json:"occupancy_rate"`
	RevPAS          float64   `json:"revpas"`
}

type RevPASReport struct {
	Revenue         float64     `json:"revenue"`
	AvailableSpaces int64       `json:"available_spaces"`
	RevPAS          float64     `json:"revpas"`
	ByBranch        []RevPASRow `json:"by_branch"`
	ByService       []RevPASRow `json:"by_service"`
}

type BenchmarkRow struct {
	BranchID      uuid.UUID          `json:"branch_id"`
	BranchName    string             `json:"branch_name"`
	Revenue       float64            `json:"revenue"`
	NewClients    int64              `json:"new_clients"`
	ActiveMembers int64              `json:"active_members"`
	CheckIns      int64              `json:"check_ins"`
	Capacity      int64              `json:"capacity"`
	Booked        int64              `json:"booked"`
	Occupancy     float64            `json:"occupancy_rate"`
	NPS           *float64           `json:"nps"`
	Indexes       map[string]float64 `json:"indexes" gorm:"-"`
	Score         float64            `json:"score" gorm:"-"`
	Rank          int                `json:"rank" gorm:"-"`
	BestIn        []string           `json:"best_in" gorm:"-"`
}

type BenchmarkReport struct {
	Branches       []BenchmarkRow     `json:"branches"`
	NetworkAverage map[string]float64 `json:"network_average"`
}

type DailyMetric struct {
	BranchID *uuid.UUID
	Day      time.Time
	Value    float64
}

// ReportFile is a rendered export.
type ReportFile struct {
	Filename    string
	ContentType string
	Data        []byte
}

// ---------------- Interfaces ----------------

type InsightsRepository interface {
	InsertWebEvent(ctx context.Context, sessionID, eventType, path string, userID *uuid.UUID) error
	GetConversionStats(ctx context.Context, r DateRange) (*ConversionStats, error)
	GetNPSSummary(ctx context.Context, r DateRange) (*NPSSummary, error)
	GetRevPAS(ctx context.Context, r DateRange, branchID *uuid.UUID) (*RevPASReport, error)
	GetBenchmarkRows(ctx context.Context, r DateRange) ([]BenchmarkRow, error)
	GetDailySeries(ctx context.Context, metric string, days int) ([]DailyMetric, error)

	InsertAlert(ctx context.Context, a *KPIAlert) (bool, error)
	ListAlerts(ctx context.Context, onlyOpen bool, branchID *uuid.UUID, limit int) ([]KPIAlert, error)
	AcknowledgeAlert(ctx context.Context, id, userID uuid.UUID) error
	GetAlertRecipients(ctx context.Context, branchID *uuid.UUID) ([]uuid.UUID, error)

	ListTemplates(ctx context.Context) ([]ReportTemplate, error)
	GetTemplate(ctx context.Context, id *uuid.UUID) (*ReportTemplate, error)
	SaveTemplate(ctx context.Context, t *ReportTemplate) error
	DeleteTemplate(ctx context.Context, id uuid.UUID) error

	ListSchedules(ctx context.Context) ([]ReportSchedule, error)
	GetSchedule(ctx context.Context, id uuid.UUID) (*ReportSchedule, error)
	SaveSchedule(ctx context.Context, s *ReportSchedule) error
	DeleteSchedule(ctx context.Context, id uuid.UUID) error
	GetDueSchedules(ctx context.Context) ([]ReportSchedule, error)
	MarkScheduleSent(ctx context.Context, id uuid.UUID) error

	CreateShareLink(ctx context.Context, l *ReportShareLink) error
	GetShareLink(ctx context.Context, tokenHash string) (*ReportShareLink, error)
	IncrementShareLinkAccess(ctx context.Context, tokenHash string) error
	ListShareLinks(ctx context.Context) ([]ReportShareLink, error)
	DeleteShareLink(ctx context.Context, tokenHash string) error

	CreateAPIKey(ctx context.Context, k *BIAPIKey) error
	GetAPIKeyByHash(ctx context.Context, hash string) (*BIAPIKey, error)
	TouchAPIKey(ctx context.Context, id uuid.UUID) error
	ListAPIKeys(ctx context.Context) ([]BIAPIKey, error)
	RevokeAPIKey(ctx context.Context, id uuid.UUID) error
}

type ShareLinkRequest struct {
	ReportType  string
	Format      string
	BranchID    *uuid.UUID
	TemplateID  *uuid.UUID
	PeriodStart time.Time
	PeriodEnd   time.Time
	ExpiresIn   time.Duration
	CreatedBy   *uuid.UUID
}

type InsightsServiceInterface interface {
	TrackWebEvent(ctx context.Context, sessionID, eventType, path string, userID *uuid.UUID) error
	GetConversionStats(ctx context.Context, r DateRange) (*ConversionStats, error)
	GetNPSSummary(ctx context.Context, r DateRange) (*NPSSummary, error)
	GetRevPAS(ctx context.Context, r DateRange, branchID *uuid.UUID) (*RevPASReport, error)
	GetBenchmark(ctx context.Context, r DateRange) (*BenchmarkReport, error)

	DetectAnomalies(ctx context.Context) ([]KPIAlert, error)
	ListAlerts(ctx context.Context, onlyOpen bool, branchID *uuid.UUID, limit int) ([]KPIAlert, error)
	AcknowledgeAlert(ctx context.Context, id, userID uuid.UUID) error

	ListTemplates(ctx context.Context) ([]ReportTemplate, error)
	SaveTemplate(ctx context.Context, t *ReportTemplate) error
	DeleteTemplate(ctx context.Context, id uuid.UUID) error

	ListSchedules(ctx context.Context) ([]ReportSchedule, error)
	SaveSchedule(ctx context.Context, s *ReportSchedule) error
	DeleteSchedule(ctx context.Context, id uuid.UUID) error
	SendSchedule(ctx context.Context, id uuid.UUID) error
	RunDueSchedules(ctx context.Context) (int, error)

	CreateShareLink(ctx context.Context, req ShareLinkRequest) (token string, link *ReportShareLink, err error)
	ResolveShareLink(ctx context.Context, token string) (*ReportFile, error)
	ListShareLinks(ctx context.Context) ([]ReportShareLink, error)
	DeleteShareLink(ctx context.Context, id string) error
	ShareURL(token string) string

	GenerateReport(ctx context.Context, reportType, format string, branchID, templateID *uuid.UUID, start, end time.Time) (*ReportFile, error)

	CreateAPIKey(ctx context.Context, name string, expiresAt *time.Time, createdBy uuid.UUID) (plain string, key *BIAPIKey, err error)
	AuthenticateAPIKey(ctx context.Context, plain string) (*BIAPIKey, error)
	ListAPIKeys(ctx context.Context) ([]BIAPIKey, error)
	RevokeAPIKey(ctx context.Context, id uuid.UUID) error
}
