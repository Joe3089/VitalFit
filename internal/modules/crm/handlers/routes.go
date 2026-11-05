package crmhandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type CRMHandlersInterface interface {
	CRMRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
}

type CRMHandlers struct {
	services appservices.Services
}

func NewCRMHandlers(services appservices.Services) *CRMHandlers {
	return &CRMHandlers{services: services}
}

func (h *CRMHandlers) CRMRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	// Public contact form (HU-ECOMMERCE-23)
	rg.POST("/public/contact", h.SubmitContactHandler)

	// Authenticated self-service routes for any user (clients included)
	self := rg.Group("")
	self.Use(m.AuthJwtTokenMiddleware(), m.AuditLogMiddleware())
	{
		self.POST("/nps", h.SubmitNPSHandler)
		self.POST("/me/feedback", h.CreateOwnFeedbackHandler)
		self.GET("/me/feedback", h.ListOwnFeedbackHandler)
	}

	crm := rg.Group("/crm")
	crm.Use(m.AuthJwtTokenMiddleware(), m.AuditLogMiddleware())
	{
		crm.GET("/feedback", m.RBACPermission("crm:feedback_manage"), h.ListFeedbackHandler)
		crm.POST("/feedback", m.RBACPermission("crm:feedback_manage"), h.CreateFeedbackHandler)
		crm.PATCH("/feedback/:id", m.RBACPermission("crm:feedback_manage"), h.UpdateFeedbackHandler)

		crm.GET("/tags", m.RBACPermission("crm:tags_manage"), h.ListTagsHandler)
		crm.POST("/tags", m.RBACPermission("crm:tags_manage"), h.CreateTagHandler)
		crm.DELETE("/tags/:id", m.RBACPermission("crm:tags_manage"), h.DeleteTagHandler)
		crm.GET("/clients/:id/tags", m.RBACPermission("crm:tags_manage", "users:get"), h.GetClientTagsHandler)
		crm.POST("/clients/:id/tags", m.RBACPermission("crm:tags_manage"), h.AssignTagHandler)
		crm.DELETE("/clients/:id/tags/:tagId", m.RBACPermission("crm:tags_manage"), h.UnassignTagHandler)

		crm.GET("/clients/:id/score", m.RBACPermission("users:get"), h.GetClientScoreHandler)
		crm.GET("/segments", m.RBACPermission("insights:view", "users:list"), h.GetSegmentsHandler)
		crm.POST("/segments/recalculate", m.RBACPermission("insights:manage"), h.RecalculateSegmentsHandler)

		crm.GET("/contact-messages", m.RBACPermission("crm:contact_view"), h.ListContactMessagesHandler)
		crm.PATCH("/contact-messages/:id", m.RBACPermission("crm:contact_view"), h.UpdateContactMessageHandler)
	}
}
