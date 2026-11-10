package notiservice

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	"github.com/vitalfit/api/internal/shared/notifications"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type NotificationService struct {
	store store.Storage
	noti  notifications.PushService
}

func NewNotificationService(store store.Storage, noti notifications.PushService) *NotificationService {
	return &NotificationService{
		store: store,
		noti:  noti,
	}
}

func (s *NotificationService) CreateNotification(ctx context.Context, n *notidomain.Notification) error {
	return s.store.Notification.CreateNotification(ctx, n)
}

func (s *NotificationService) CreateBatchNotifications(ctx context.Context, notifications []notidomain.Notification) error {
	return s.store.Notification.CreateBatchNotifications(ctx, notifications)
}

func (s *NotificationService) GetNotificationsByUserID(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]notidomain.Notification, error) {
	return s.store.Notification.GetNotificationsByUserID(ctx, userID, fq)
}

func (s *NotificationService) CountUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.store.Notification.CountUnread(ctx, userID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID uuid.UUID) error {
	return s.store.Notification.MarkAsRead(ctx, notificationID)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.store.Notification.MarkAllAsRead(ctx, userID)
}

func (s *NotificationService) SendBroadcast(ctx context.Context, title, message string) error {
	jobCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	users, err := s.store.Users.GetAllClients(jobCtx)
	if err != nil {
		return err
	}

	jobs := make(chan string, 100)
	var wg sync.WaitGroup

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for token := range jobs {
				_ = s.noti.SendPush(jobCtx, token, title, message, nil)
			}
		}()
	}

	for _, user := range users {
		sentTokens := make(map[string]struct{})
		session, err := s.store.Session.GetUserSessions(jobCtx, user.UserID)
		if err != nil {
			continue
		}
		for _, ses := range session {
			if ses.DeviceToken != "" {
				if _, exists := sentTokens[ses.DeviceToken]; exists {
					continue
				}
				sentTokens[ses.DeviceToken] = struct{}{}
				jobs <- ses.DeviceToken
			}
		}
	}
	close(jobs)
	wg.Wait()
	return nil

}

func (s *NotificationService) SendPushNotification(ctx context.Context, title, message string, userID uuid.UUID) error {
	jobCtx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()

	sessions, err := s.store.Session.GetUserSessions(jobCtx, userID)
	if err != nil {
		return err
	}

	for _, ses := range sessions {
		if ses.DeviceToken != "" {
			_ = s.noti.SendPush(jobCtx, ses.DeviceToken, title, message, nil)
		}
	}
	return nil
}
