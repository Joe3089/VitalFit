package auditdomain

import (
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID uint64 `gorm:"primaryKey;autoIncrement" json:"id"`

	UserID *uuid.UUID `gorm:"type:uuid;index" json:"user_id"`

	Method    string    `gorm:"size:10;not null" json:"method"`
	Path      string    `gorm:"not null" json:"path"`
	Status    int       `gorm:"not null" json:"status"`
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	Payload   string    `gorm:"type:jsonb" json:"payload"`
	CreatedAt time.Time `gorm:"index;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (a *AuditLog) TableName() string {
	return "audit_logs"
}
