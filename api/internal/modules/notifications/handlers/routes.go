package notihandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type NotificationHandlersInterface interface {
	NotificationsRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
}

type NotificationHandlers struct {
	services appservices.Services
}

func NewNotificationHandlers(services appservices.Services) *NotificationHandlers {
	return &NotificationHandlers{
		services: services,
	}
}

func (r *NotificationHandlers) NotificationsRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	notificationsGroup := rg.Group("/notifications")
	{
		notificationsGroup.Use(m.AuthJwtTokenMiddleware())
		notificationsGroup.GET("", r.GetNotificationsHandler)
		notificationsGroup.GET("/unread-count", r.GetUnreadCountHandler)
		notificationsGroup.PATCH("/:id/read", r.MarkAsReadHandler)
		notificationsGroup.PATCH("/read-all", r.MarkAllAsReadHandler)
		notificationsGroup.POST("/broadcast", m.RBACPermission("notifications:send"), r.SendBroadcastHandler)
	}
}
