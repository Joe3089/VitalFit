package bookingdomain

import (
	"time"

	"github.com/google/uuid"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	"gorm.io/gorm"
)

type BookingStatus string

const (
	BookingStatusConfirmed         BookingStatus = "Confirmed"
	BookingStatusCancelledByUser   BookingStatus = "CancelledByUser"
	BookingStatusCancelledBySystem BookingStatus = "CancelledBySystem"
)

type Booking struct {
	BookingID uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"booking_id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex:idx_user_class" json:"user_id"`
	ClassID   uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex:idx_user_class" json:"class_id"`
	Status    BookingStatus  `gorm:"type:booking_status_enum;not null;default:'Confirmed'" json:"status"`
	CreatedAt time.Time      `gorm:"type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relaciones
	Class scheduledomain.Class `gorm:"foreignKey:ClassID" json:"-"`
}

type BookingWithClassInfo struct {
	BookingID   uuid.UUID `json:"booking_id"`
	ClassID     uuid.UUID `json:"class_id"`
	StartsAt    time.Time `json:"starts_at"`
	EndsAt      time.Time `json:"ends_at"`
	ServiceName string    `json:"service_name"`
	Instructor  string    `json:"instructor"`
	BranchName  string    `json:"branch_name"`
}

type BookingWithUserInfo struct {
	BookingID uuid.UUID `json:"booking_id"`
	UserID    uuid.UUID `json:"user_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type BookingReminder struct {
	BookingID      uuid.UUID     `json:"booking_id"`
	UserID         uuid.UUID     `json:"user_id"`
	FirstName      string        `json:"first_name"`
	LastName       string        `json:"last_name"`
	Email          string        `json:"email"`
	ClassID        uuid.UUID     `json:"class_id"`
	ServiceID      uuid.UUID     `json:"service_id"`
	ServiceName    string        `json:"service_name"`
	StartsAt       time.Time     `json:"starts_at"`
	TimeUntilStart time.Duration `json:"time_until_start"`
}

func (Booking) TableName() string {
	return "bookings"
}
