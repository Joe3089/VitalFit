package crmdomain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Feedback (HU-CLI-08)

type FeedbackType string
type FeedbackStatus string

const (
	FeedbackComplaint  FeedbackType = "complaint"
	FeedbackSuggestion FeedbackType = "suggestion"
	FeedbackCompliment FeedbackType = "compliment"

	FeedbackOpen       FeedbackStatus = "open"
	FeedbackInProgress FeedbackStatus = "in_progress"
	FeedbackResolved   FeedbackStatus = "resolved"
	FeedbackClosed     FeedbackStatus = "closed"
)

type ClientFeedback struct {
	FeedbackID      uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"feedback_id"`
	UserID          uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	BranchID        *uuid.UUID     `gorm:"type:uuid" json:"branch_id"`
	Type            FeedbackType   `gorm:"type:varchar(20);not null" json:"type"`
	Subject         string         `gorm:"type:varchar(255);not null" json:"subject"`
	Description     string         `gorm:"type:text;not null" json:"description"`
	Status          FeedbackStatus `gorm:"type:varchar(20);not null;default:'open'" json:"status"`
	ResolutionNotes string         `gorm:"type:text" json:"resolution_notes"`
	CreatedBy       *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	ResolvedBy      *uuid.UUID     `gorm:"type:uuid" json:"resolved_by"`
	ResolvedAt      *time.Time     `json:"resolved_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

func (ClientFeedback) TableName() string { return "client_feedback" }

// FeedbackView is a feedback row enriched with client and branch names.
type FeedbackView struct {
	ClientFeedback
	ClientName  string `json:"client_name"`
	ClientEmail string `json:"client_email"`
	BranchName  string `json:"branch_name"`
}

type FeedbackFilter struct {
	UserID   *uuid.UUID
	BranchID *uuid.UUID
	Status   string
	Type     string
	Limit    int
	Page     int
}

// Tags (HU-CLI-13)

type ClientTag struct {
	TagID     uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"tag_id"`
	Name      string    `gorm:"type:varchar(60);not null;unique" json:"name"`
	Color     string    `gorm:"type:varchar(20);not null" json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

func (ClientTag) TableName() string { return "client_tags" }

type TagWithCount struct {
	ClientTag
	ClientCount int64 `json:"client_count"`
}

// Scoring & segmentation (HU-CLI-09, HU-CLI-12)

type ClientScoreBreakdown struct {
	UserID            uuid.UUID `json:"user_id"`
	Score             int       `json:"score"`
	FrequencyScore    float64   `json:"frequency_score"`
	PunctualityScore  float64   `json:"punctuality_score"`
	ReferralScore     float64   `json:"referral_score"`
	Visits90d         int64     `gorm:"column:visits_90d" json:"visits_90d"`
	InvoicesTotal     int64     `json:"invoices_total"`
	InvoicesOnTime    int64     `json:"invoices_on_time"`
	Category          string    `json:"category"`
	ScoringWeightNote string    `json:"scoring_weight_note"`
}

type SegmentCount struct {
	Category string `json:"category"`
	Total    int64  `json:"total"`
}

// NPS (HU-ANALYTICS-06)

type NPSResponse struct {
	ResponseID uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"response_id"`
	UserID     *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	BranchID   *uuid.UUID `gorm:"type:uuid" json:"branch_id"`
	Score      int        `gorm:"type:smallint;not null" json:"score"`
	Comment    string     `gorm:"type:text" json:"comment"`
	Channel    string     `gorm:"type:varchar(20);not null" json:"channel"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (NPSResponse) TableName() string { return "nps_responses" }

// Contact form (HU-ECOMMERCE-23)

type ContactMessage struct {
	MessageID uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"message_id"`
	Name      string     `gorm:"type:varchar(150);not null" json:"name"`
	Email     string     `gorm:"type:varchar(255);not null" json:"email"`
	Phone     string     `gorm:"type:varchar(50)" json:"phone"`
	Subject   string     `gorm:"type:varchar(255);not null" json:"subject"`
	Message   string     `gorm:"type:text;not null" json:"message"`
	BranchID  *uuid.UUID `gorm:"type:uuid" json:"branch_id"`
	Status    string     `gorm:"type:varchar(20);not null;default:'new'" json:"status"`
	CreatedAt time.Time  `json:"created_at"`
}

func (ContactMessage) TableName() string { return "contact_messages" }

type CRMRepository interface {
	CreateFeedback(ctx context.Context, f *ClientFeedback) error
	GetFeedbackByID(ctx context.Context, id uuid.UUID) (*ClientFeedback, error)
	UpdateFeedback(ctx context.Context, f *ClientFeedback) error
	ListFeedback(ctx context.Context, filter FeedbackFilter) ([]FeedbackView, int64, error)

	ListTags(ctx context.Context) ([]TagWithCount, error)
	CreateTag(ctx context.Context, tag *ClientTag) error
	DeleteTag(ctx context.Context, tagID uuid.UUID) error
	GetClientTags(ctx context.Context, userID uuid.UUID) ([]ClientTag, error)
	AssignTag(ctx context.Context, userID, tagID uuid.UUID) error
	UnassignTag(ctx context.Context, userID, tagID uuid.UUID) error
	GetClientIDsByTag(ctx context.Context, tagID uuid.UUID) ([]uuid.UUID, error)

	RecalculateScores(ctx context.Context) (int64, error)
	RecalculateSegments(ctx context.Context, newClientDays, vipMinScore int) (int64, error)
	GetClientScore(ctx context.Context, userID uuid.UUID) (*ClientScoreBreakdown, error)
	GetSegmentCounts(ctx context.Context, branchID *uuid.UUID) ([]SegmentCount, error)

	CreateNPSResponse(ctx context.Context, r *NPSResponse) error
	CreateContactMessage(ctx context.Context, m *ContactMessage) error
	ListContactMessages(ctx context.Context, status string, limit, page int) ([]ContactMessage, int64, error)
	UpdateContactMessageStatus(ctx context.Context, id uuid.UUID, status string) error
}

type CRMServiceInterface interface {
	CreateFeedback(ctx context.Context, f *ClientFeedback) error
	UpdateFeedbackStatus(ctx context.Context, id uuid.UUID, status FeedbackStatus, notes string, actorID uuid.UUID) (*ClientFeedback, error)
	ListFeedback(ctx context.Context, filter FeedbackFilter) ([]FeedbackView, int64, error)

	ListTags(ctx context.Context) ([]TagWithCount, error)
	CreateTag(ctx context.Context, name, color string) (*ClientTag, error)
	DeleteTag(ctx context.Context, tagID uuid.UUID) error
	GetClientTags(ctx context.Context, userID uuid.UUID) ([]ClientTag, error)
	AssignTag(ctx context.Context, userID, tagID uuid.UUID) error
	UnassignTag(ctx context.Context, userID, tagID uuid.UUID) error

	RecalculateScoresAndSegments(ctx context.Context) (scored int64, segmented int64, err error)
	GetClientScore(ctx context.Context, userID uuid.UUID) (*ClientScoreBreakdown, error)
	GetSegmentCounts(ctx context.Context, branchID *uuid.UUID) ([]SegmentCount, error)

	SubmitNPS(ctx context.Context, r *NPSResponse) error
	SubmitContactMessage(ctx context.Context, m *ContactMessage) error
	ListContactMessages(ctx context.Context, status string, limit, page int) ([]ContactMessage, int64, error)
	UpdateContactMessageStatus(ctx context.Context, id uuid.UUID, status string) error
}
