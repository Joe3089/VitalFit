package notihandlers

import (
	"time"

	"github.com/google/uuid"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
)

type NotificationResponse struct {
	ID        uuid.UUID              `json:"id"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Type      string                 `json:"type"`
	IsRead    bool                   `json:"is_read"`
	Metadata  map[string]interface{} `json:"metadata"`
	CreatedAt time.Time              `json:"created_at"`
}

func NewNotificationResponse(n notidomain.Notification) NotificationResponse {
	return NotificationResponse{
		ID:        n.ID,
		Title:     n.Title,
		Message:   n.Message,
		Type:      n.Type,
		IsRead:    n.IsRead,
		Metadata:  n.Metadata,
		CreatedAt: n.CreatedAt,
	}
}

type UnreadCountResponse struct {
	Count int64 `json:"count"`
}
type BroadcastRequest struct {
	Title   string `json:"title" binding:"required"`
	Message string `json:"message" binding:"required"`
}
