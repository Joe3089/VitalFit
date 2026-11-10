package staffhandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type StaffHandlersInterface interface {
	StaffRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	AssignStaffToBranchHandler(c *gin.Context)
	ListBranchStaffByRoleHandler(c *gin.Context)
	RemoveStaffFromBranchHandler(c *gin.Context)
	GetManagedBranchesHandler(c *gin.Context)
	GetStaffBranchesHandler(c *gin.Context)
	GetInstructorBranchesHandler(c *gin.Context)
}

type StaffHandlers struct {
	services appservices.Services
}

func NewStaffHandlers(services appservices.Services) *StaffHandlers {
	return &StaffHandlers{services: services}
}

func (h *StaffHandlers) StaffRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	staffRoutes := rg.Group("/branches/:id/staff")
	{
		staffRoutes.Use(m.AuthJwtTokenMiddleware())
		staffRoutes.Use(m.AuditLogMiddleware())
		staffRoutes.POST("", m.RBACPermission("branch_management"), h.AssignStaffToBranchHandler)
		staffRoutes.GET("", m.RBACPermission("branch_management"), h.ListBranchStaffByRoleHandler)
		staffRoutes.DELETE("/:staffId", m.RBACPermission("branch_management"), h.RemoveStaffFromBranchHandler)
	}

	staffMemberRoutes := rg.Group("/staff")
	{
		staffMemberRoutes.Use(m.AuthJwtTokenMiddleware())
		staffMemberRoutes.Use(m.AuditLogMiddleware())
		staffMemberRoutes.GET("/managed-branches", h.GetManagedBranchesHandler)
		staffMemberRoutes.GET("/branches", h.GetStaffBranchesHandler)
		staffMemberRoutes.GET("/instructor-branches", h.GetInstructorBranchesHandler)
	}
}
