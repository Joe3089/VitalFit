package audithandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type AuditHandlersInterface interface {
	SetupRoutes(router *gin.RouterGroup, m *auth.AuthMiddleware)
	GetUserLogsHandler(c *gin.Context)
	GetAllLogsHandler(c *gin.Context)
}

type AuditHandlers struct {
	services appservices.Services
}

func NewAuditHandlers(services appservices.Services) *AuditHandlers {
	return &AuditHandlers{
		services: services,
	}
}

func (h *AuditHandlers) SetupRoutes(router *gin.RouterGroup, m *auth.AuthMiddleware) {
	auditGroup := router.Group("/audit-logs")
	{
		auditGroup.Use(m.AuthJwtTokenMiddleware())
		auditGroup.Use(m.AuditLogMiddleware())

		auditGroup.GET("/user/:userId", m.RBACPermission("audit:list"), h.GetUserLogsHandler)
		auditGroup.GET("", m.RBACPermission("audit:list"), h.GetAllLogsHandler)
	}
}
