package notidomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type NotificationServiceInterface interface {
	CreateNotification(ctx context.Context, n *Notification) error
	CreateBatchNotifications(ctx context.Context, notifications []Notification) error
	GetNotificationsByUserID(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]Notification, error)
	CountUnread(ctx context.Context, userID uuid.UUID) (int64, error)
	MarkAsRead(ctx context.Context, notificationID uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	SendBroadcast(ctx context.Context, title, message string) error
	SendPushNotification(ctx context.Context, title, message string, userID uuid.UUID) error
}
