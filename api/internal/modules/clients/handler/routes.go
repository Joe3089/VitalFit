package clientshandler

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type ClientHandlerInterface interface {
	ClientRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	CreateMedicalInfoHandler(c *gin.Context)
	GetMedicalInfoHandler(c *gin.Context)
	UpdateMedicalInfoHandler(c *gin.Context)
}

type ClientHandler struct {
	services appservices.Services
}

func NewClientHandler(services appservices.Services) *ClientHandler {
	return &ClientHandler{
		services: services,
	}
}

func (h *ClientHandler) ClientRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	clientsGroup := rg.Group("/clients")
	clientsGroup.Use(m.AuthJwtTokenMiddleware())
	clientsGroup.Use(m.AuditLogMiddleware())

	clientsGroup.POST("/:id/medical-info",
		h.CreateMedicalInfoHandler,
	)

	clientsGroup.GET("/:id/medical-info",
		h.GetMedicalInfoHandler,
	)

	clientsGroup.PUT("/:id/medical-info",
		h.UpdateMedicalInfoHandler,
	)
}
