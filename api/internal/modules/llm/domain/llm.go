package llmdomain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

const (
	RoleUser         = "user"
	RoleRecepcionist = "recepcionist"
	RoleInstructor   = "instructor"
	RoleClient       = "client"
	RoleSystem       = "system"
	RoleTool         = "tool"
	RoleAssistant    = "assistant"
)

type Conversation struct {
	ConversationID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"conversation_id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	IsActive       bool      `gorm:"default:true;index" json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	Messages []Message `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
}

func (Conversation) TableName() string {
	return "conversations"
}

type Message struct {
	MessageID      uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"message_id"`
	ConversationID uuid.UUID      `gorm:"type:uuid;not null;index" json:"conversation_id"`
	SenderRole     string         `gorm:"type:varchar(20);not null" json:"sender_role"`
	Content        string         `gorm:"type:text;not null" json:"content"`
	Metadata       datatypes.JSON `gorm:"type:jsonb;default:'{}'::jsonb" json:"metadata" swaggertype:"object"`
	CreatedAt      time.Time      `json:"created_at"`
}

func (Message) TableName() string {
	return "messages"
}
