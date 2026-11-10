package scheduledomain

import (
	"time"

	"github.com/google/uuid"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	"gorm.io/gorm"
)

const (
	ClassStatusScheduled = "Scheduled"
	ClassStatusCancelled = "Cancelled"
)

type Class struct {
	ClassID      uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"class_id"`
	BranchID     uuid.UUID `gorm:"type:uuid;not null" json:"branch_id"`
	ServiceID    uuid.UUID `gorm:"type:uuid;not null" json:"service_id"`
	InstructorID uuid.UUID `gorm:"type:uuid;not null" json:"instructor_id"`

	StartsAt    time.Time `gorm:"type:timestamptz;not null" json:"starts_at"`
	EndsAt      time.Time `gorm:"type:timestamptz;not null" json:"ends_at"`
	MaxCapacity int       `gorm:"type:int;not null" json:"max_capacity"`
	IsVisible   bool      `gorm:"type:boolean;default:true;not null" json:"is_visible"`
	Notes       string    `gorm:"type:text" json:"notes"`

	Status             string     `gorm:"type:varchar(20);not null;default:'Scheduled'" json:"status"`
	CancellationReason string     `gorm:"type:text" json:"cancellation_reason,omitempty"`
	CancelledAt        *time.Time `json:"cancelled_at,omitempty"`
	CancelledBy        *uuid.UUID `gorm:"type:uuid" json:"cancelled_by,omitempty"`

	CreatedAt  time.Time                   `gorm:"default:now()" json:"created_at"`
	UpdatedAt  time.Time                   `json:"updated_at"`
	DeletedAt  gorm.DeletedAt              `gorm:"index" json:"-"`
	Branch     branchdomain.Branch         `gorm:"foreignKey:BranchID;references:BranchID" json:"-"`
	Service    productsdomain.Service      `gorm:"foreignKey:ServiceID;references:ServiceID" json:"-"`
	Instructor instructordomain.Instructor `gorm:"foreignKey:InstructorID;references:InstructorID" json:"-"`
}

func (Class) TableName() string {
	return "classes"
}
