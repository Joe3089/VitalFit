package llmhandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type LLMHandlersInterface interface {
	LLMRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
}

type LLMHandlers struct {
	services appservices.Services
}

func NewLLMHandlers(appservices appservices.Services) *LLMHandlers {
	return &LLMHandlers{
		services: appservices,
	}
}

func (h *LLMHandlers) LLMRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	llmGroup := rg.Group("/llm")
	llmGroup.Use(m.AuthJwtTokenMiddleware())
	llmGroup.POST("/chat", h.ChatHandler)
	llmGroup.GET("/history", h.GetHistoryHandler)
	llmGroup.POST("/reset", h.ResetChatHandler)
}
