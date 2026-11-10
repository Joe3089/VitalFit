package accesshandler

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type AccessHandlerInterface interface {
	AccessRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	CheckInHandler(c *gin.Context)
	CheckInByUserIDHandler(c *gin.Context)
	CheckInFaceHandler(c *gin.Context)
	GetClientAttendanceHistoryHandler(c *gin.Context)
	GetClientServiceUsageHandler(c *gin.Context)
	GetClassAttendanceHistoryHandler(c *gin.Context)
	GetClientScoresHandler(c *gin.Context)
}

type AccessHandler struct {
	services appservices.Services
}

func NewAccessHandler(services appservices.Services) *AccessHandler {
	return &AccessHandler{
		services: services,
	}
}

func (r *AccessHandler) AccessRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	accessGroup := rg.Group("/access")
	accessGroup.Use(m.AuthJwtTokenMiddleware())
	accessGroup.Use(m.AuditLogMiddleware())

	accessGroup.POST("/check-in", m.RBACPermission("access:check_in"), r.CheckInHandler)
	accessGroup.POST("/check-in/manual", m.RBACPermission("access:check_in"), r.CheckInByUserIDHandler)
	accessGroup.POST("/check-in/face", m.RBACPermission("access:check_in"), r.CheckInFaceHandler)

	accessGroup.GET("/scores", m.RBACPermission("access:view_client_history"), r.GetClientScoresHandler)
	accessGroup.GET("/classes/:id/attendance", m.RBACPermission("access:view_class_history"), r.GetClassAttendanceHistoryHandler)

	// Client attendance and service usage routes
	clientsGroup := rg.Group("/clients")
	clientsGroup.Use(m.AuthJwtTokenMiddleware())
	clientsGroup.Use(m.AuditLogMiddleware())
	{
		clientsGroup.GET("/:id/attendance-history", m.RBACPermission("access:view_client_history"), r.GetClientAttendanceHistoryHandler)
		clientsGroup.GET("/:id/service-usage", m.RBACPermission("access:view_client_history"), r.GetClientServiceUsageHandler)
	}
}
