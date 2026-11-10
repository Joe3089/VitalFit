package authdomain

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	UserID uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	DeviceToken  string `gorm:"type:text" json:"device_token"`
	RefreshToken string `gorm:"type:text;index" json:"refresh_token"`
	UserAgent    string `gorm:"type:text" json:"user_agent"`
	ClientIP     string `gorm:"size:45" json:"client_ip"`
	IsBlocked    bool   `gorm:"default:false" json:"is_blocked"`

	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	// User User `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
}

func (Session) TableName() string {
	return "sessions"
}
