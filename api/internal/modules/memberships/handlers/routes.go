package membershipshandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type MembershipsHandlerInterface interface {
	MembershipRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	PublicMembershipRoutes(rg *gin.RouterGroup)

	GetClientsMemberships(c *gin.Context)
	GetClientMembershipByID(c *gin.Context)
	ExportMembershipTypesHandler(c *gin.Context)
	UpdateClientMembership(c *gin.Context)
	GetMyMembershipHandler(c *gin.Context)
}

type MembershipHandler struct {
	services appservices.Services
}

func NewMembershipHandler(services appservices.Services) *MembershipHandler {
	return &MembershipHandler{
		services: services,
	}
}

func (r *MembershipHandler) MembershipRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	membershipPlansGroup := rg.Group("/membership-plans")
	{
		membershipPlansGroup.Use(m.AuthJwtTokenMiddleware())
		membershipPlansGroup.Use(m.AuditLogMiddleware())

		membershipPlansGroup.POST("", m.RBACPermission("memberships:create"), r.CreateMembershipHandler)
		membershipPlansGroup.GET("", m.RBACPermission("memberships:list"), r.GetMembershipsHandler)
		membershipPlansGroup.GET("/summary", m.RBACPermission("memberships:list"), r.GetSummaryMembershipsHandler)
		membershipPlansGroup.GET("/export", m.RBACPermission("memberships:list"), r.ExportMembershipTypesHandler)
		membershipPlansGroup.GET("/:id", m.RBACPermission("memberships:get"), r.GetMembershipByIDHandler)
		membershipPlansGroup.PUT("/:id", m.RBACPermission("memberships:update"), r.UpdateMembershipHandler)
		membershipPlansGroup.DELETE("/:id", m.RBACPermission("memberships:delete"), r.DeleteMembershipHandler)
	}

	clientMembershipsGroup := rg.Group("/client-memberships")
	{
		clientMembershipsGroup.Use(m.AuthJwtTokenMiddleware())
		clientMembershipsGroup.Use(m.AuditLogMiddleware())
		clientMembershipsGroup.GET("/me", r.GetMyMembershipHandler)
		clientMembershipsGroup.GET("", m.RBACPermission("members:list"), r.GetClientsMemberships)
		clientMembershipsGroup.GET("/:clientMembershipId", m.RBACPermission("members:get"), r.GetClientMembershipByID)
		clientMembershipsGroup.PUT("/:clientMembershipId", r.UpdateClientMembership)
	}

	// Cancellation Reasons routes
	// Access: Super Admin exclusive
	cancellationReasonsGroup := rg.Group("/memberships/cancellation-reasons")
	{
		cancellationReasonsGroup.Use(m.AuthJwtTokenMiddleware())
		cancellationReasonsGroup.Use(m.AuditLogMiddleware())
		cancellationReasonsGroup.POST("", m.RBACPermission("cancellation-reasons:create"), r.CreateCancellationReasonHandler)
		cancellationReasonsGroup.GET("", r.GetCancellationReasonsHandler)
		cancellationReasonsGroup.PUT("/:id", m.RBACPermission("cancellation-reasons:update"), r.UpdateCancellationReasonHandler)
		cancellationReasonsGroup.DELETE("/:id", m.RBACPermission("cancellation-reasons:delete"), r.DeleteCancellationReasonHandler)
	}
}

func (r *MembershipHandler) PublicMembershipRoutes(rg *gin.RouterGroup) {
	publicMembershipPlansGroup := rg.Group("/public")
	{
		publicMembershipPlansGroup.GET("/membership-plans", r.PublicGetMembershipsTypeHandler)
	}
}
