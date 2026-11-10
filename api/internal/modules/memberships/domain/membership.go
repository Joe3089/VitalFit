package membershipsdomain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MembershipType struct {
	MembershipTypeID uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"membership_type_id"`
	Name             string         `gorm:"type:varchar(100);unique;not null" json:"name"`
	Description      string         `gorm:"type:text" json:"description"`
	DurationDays     int            `gorm:"not null" json:"duration_days"`
	Price            float64        `gorm:"type:numeric(10,2);not null" json:"price"`
	IsActive         bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt        time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (MembershipType) TableName() string {
	return "membership_types"
}

type MembershipSummary struct {
	Total     int64 `json:"total"`
	Actives   int64 `json:"actives"`
	Inactives int64 `json:"inactives"`
}

type MembershipExpiringDetail struct {
	UserID           uuid.UUID `json:"user_id"`
	UserName         string    `json:"user_name"`
	UserEmail        string    `json:"user_email"`
	MembershipTypeID uuid.UUID `json:"membership_type_id"`
	MembershipName   string    `json:"membership_name"`
	DaysRemaining    int       `json:"days_remaining"`
}

type MembershipStatus string

const (
	StatusActive    MembershipStatus = "Active"
	StatusExpired   MembershipStatus = "Expired"
	StatusCancelled MembershipStatus = "Cancelled"
)

type CancellationReason struct {
	ReasonID    uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"reason_id"`
	Description string         `gorm:"type:varchar(255);unique;not null" json:"description"`
	IsActive    bool           `gorm:"type:boolean;not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `gorm:"default:now()" json:"created_at"`
	UpdatedAt   *time.Time     `json:"updated_at,omitempty"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`
}

func (CancellationReason) TableName() string {
	return "cancellation_reasons"
}

type User struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	FirstName string    `gorm:"type:varchar(100);not null" json:"first_name"`
	LastName  string    `gorm:"type:varchar(100);not null" json:"last_name"`
	Email     string    `gorm:"type:varchar(100);unique;not null" json:"email"`
}

func (User) TableName() string {
	return "users"
}

type ClientMembership struct {
	ClientMembershipID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"client_membership_id"`
	UserID             uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	MembershipTypeID   uuid.UUID `gorm:"type:uuid;not null" json:"membership_type_id"`

	StartDate time.Time `gorm:"type:date;not null" json:"start_date"`
	EndDate   time.Time `gorm:"type:date;not null" json:"end_date"`

	Status    MembershipStatus `gorm:"type:membership_status;not null" json:"status"`
	InvoiceID uuid.UUID        `gorm:"type:uuid;not null" json:"invoice_id"`

	CancellationReasonID *uuid.UUID `gorm:"type:uuid;default:null" json:"cancellation_reason_id,omitempty"`
	CancellationNotes    string     `gorm:"type:text" json:"cancellation_notes,omitempty"`

	User *User `gorm:"foreignKey:UserID;references:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	MembershipType *MembershipType `gorm:"foreignKey:MembershipTypeID;references:MembershipTypeID;constraint:OnDelete:RESTRICT" json:"membership_type,omitempty"`

	CancellationReason *CancellationReason `gorm:"foreignKey:CancellationReasonID;references:ReasonID;constraint:OnDelete:SET NULL" json:"cancellation_reason,omitempty"`
}

func (ClientMembership) TableName() string {
	return "client_memberships"
}
