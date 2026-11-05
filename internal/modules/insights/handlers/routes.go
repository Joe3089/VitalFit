package insightshandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type InsightsHandlersInterface interface {
	InsightsRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
}

type InsightsHandlers struct {
	services appservices.Services
}

func NewInsightsHandlers(services appservices.Services) *InsightsHandlers {
	return &InsightsHandlers{services: services}
}

func (h *InsightsHandlers) InsightsRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	// Public endpoints
	rg.POST("/public/web-events", h.TrackWebEventHandler)
	rg.GET("/public/reports/shared/:token", h.DownloadSharedReportHandler)

	in := rg.Group("/insights")
	in.Use(m.AuthJwtTokenMiddleware(), m.AuditLogMiddleware())
	{
		view := m.RBACPermission("insights:view")
		manage := m.RBACPermission("insights:manage")

		in.GET("/conversion", view, h.GetConversionHandler)
		in.GET("/nps", view, h.GetNPSHandler)
		in.GET("/revpas", view, h.GetRevPASHandler)
		in.GET("/benchmark", view, h.GetBenchmarkHandler)
		in.GET("/churn-risk", view, h.GetChurnRiskHandler)

		in.GET("/alerts", view, h.ListAlertsHandler)
		in.PATCH("/alerts/:id/ack", view, h.AcknowledgeAlertHandler)
		in.POST("/alerts/detect", manage, h.DetectAlertsHandler)

		in.GET("/reports/download", view, h.DownloadReportHandler)

		in.GET("/templates", view, h.ListTemplatesHandler)
		in.POST("/templates", manage, h.CreateTemplateHandler)
		in.PUT("/templates/:id", manage, h.UpdateTemplateHandler)
		in.DELETE("/templates/:id", manage, h.DeleteTemplateHandler)

		in.GET("/schedules", manage, h.ListSchedulesHandler)
		in.POST("/schedules", manage, h.CreateScheduleHandler)
		in.PUT("/schedules/:id", manage, h.UpdateScheduleHandler)
		in.DELETE("/schedules/:id", manage, h.DeleteScheduleHandler)
		in.POST("/schedules/:id/send", manage, h.SendScheduleHandler)

		in.GET("/share-links", manage, h.ListShareLinksHandler)
		in.POST("/share-links", manage, h.CreateShareLinkHandler)
		in.DELETE("/share-links/:id", manage, h.DeleteShareLinkHandler)

		in.GET("/api-keys", manage, h.ListAPIKeysHandler)
		in.POST("/api-keys", manage, h.CreateAPIKeyHandler)
		in.DELETE("/api-keys/:id", manage, h.RevokeAPIKeyHandler)
	}

	// BI integration API, authenticated with an API key (X-API-Key header).
	bi := rg.Group("/bi")
	bi.Use(h.APIKeyMiddleware())
	{
		bi.GET("/kpis", h.BIKPIsHandler)
		bi.GET("/benchmark", h.GetBenchmarkHandler)
		bi.GET("/revpas", h.GetRevPASHandler)
		bi.GET("/nps", h.GetNPSHandler)
		bi.GET("/conversion", h.GetConversionHandler)
		bi.GET("/sales", h.BISalesHandler)
		bi.GET("/financial", h.BIFinancialHandler)
	}
}
