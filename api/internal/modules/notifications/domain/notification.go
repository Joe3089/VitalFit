package notidomain

import (
	"time"

	"github.com/google/uuid"
)

type NotificationType string

const (
	ClassReminder      NotificationType = "class_reminder"
	BookingConfirmed   NotificationType = "booking_confirmed"
	WaitlistAvailable  NotificationType = "waitlist_available"
	MembershipExpiring NotificationType = "membership_expiring"
	PaymentFailed      NotificationType = "payment_failed"
	SystemBroadcast    NotificationType = "system_broadcast"
)

type Notification struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	UserID uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	Title   string `gorm:"size:255;not null" json:"title"`
	Message string `gorm:"type:text;not null" json:"message"`

	Type string `gorm:"size:50;default:'info'" json:"type"`

	IsRead bool `gorm:"default:false" json:"is_read"`

	Metadata map[string]interface{} `gorm:"serializer:json" json:"metadata"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP;index" json:"created_at"`
}

// TableName asegura que la tabla se llame 'notifications'
func (Notification) TableName() string {
	return "notifications"
}
