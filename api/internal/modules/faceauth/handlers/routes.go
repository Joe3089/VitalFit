package faceauthhandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type FaceAuthHandlerInterface interface {
	FaceAuthRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	EnrollFaceHandler(c *gin.Context)
}

type FaceAuthHandler struct {
	services appservices.Services
}

func NewFaceAuthHandler(services appservices.Services) *FaceAuthHandler {
	return &FaceAuthHandler{services: services}
}

func (r *FaceAuthHandler) FaceAuthRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	faceAuthGroup := rg.Group("/face-auth")

	// Rutas protegidas (requieren login previo)
	faceAuthGroup.POST("/enroll", m.AuthJwtTokenMiddleware(), r.EnrollFaceHandler)

}
