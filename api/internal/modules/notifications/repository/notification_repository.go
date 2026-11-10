package notirepository

import (
	"context"

	"github.com/google/uuid"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type NotificationStore struct {
	db *gorm.DB
}

func NewNotificationStore(db *gorm.DB) *NotificationStore {
	return &NotificationStore{
		db: db,
	}
}

func (s *NotificationStore) CreateNotification(ctx context.Context, n *notidomain.Notification) error {
	return s.db.WithContext(ctx).Create(n).Error
}

func (s *NotificationStore) CreateBatchNotifications(ctx context.Context, notifications []notidomain.Notification) error {
	return s.db.WithContext(ctx).Create(&notifications).Error
}

func (s *NotificationStore) GetNotificationsByUserID(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]notidomain.Notification, error) {
	var notifications []notidomain.Notification
	query := s.db.WithContext(ctx).Model(&notidomain.Notification{}).Where("user_id = ?", userID)

	if fq.Sort != "" {
		query = query.Order("created_at " + fq.Sort)
	} else {
		query = query.Order("created_at DESC")
	}

	err := query.Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Find(&notifications).Error

	return notifications, err
}

func (s *NotificationStore) CountUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&notidomain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (s *NotificationStore) MarkAsRead(ctx context.Context, notificationID uuid.UUID) error {
	return s.db.WithContext(ctx).Model(&notidomain.Notification{}).
		Where("id = ?", notificationID).
		Update("is_read", true).Error
}

func (s *NotificationStore) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.db.WithContext(ctx).Model(&notidomain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}
