package instructorhandler

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type InstructorHandlersInterface interface {
	InstructorRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	CreateInstructorHandler(c *gin.Context)
	GetInstructorsHandler(c *gin.Context)
	GetSummaryHandler(c *gin.Context)
	DeleteInstructorHandler(c *gin.Context)
	GetInstructorByIDHandler(c *gin.Context)
	UpdateInstructorHandler(c *gin.Context)
	ExportInstructorsHandler(c *gin.Context)

	AssignInstructorsToBranchHandler(c *gin.Context)
	ListBranchInstructorsHandler(c *gin.Context)
	RemoveInstructorFromBranchHandler(c *gin.Context)

	AssignInstructorSpecialtyHandler(c *gin.Context)
	DeleteInstructorSpecialtyHandler(c *gin.Context)

	GetAssignedClientsHandler(c *gin.Context)
}

type InstructorHandlers struct {
	services appservices.Services
}

func NewInstructorHandlers(services appservices.Services) *InstructorHandlers {
	return &InstructorHandlers{services: services}
}

func (r *InstructorHandlers) InstructorRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

	instructorGroup := rg.Group("/instructor")
	instructorGroup.Use(m.AuthJwtTokenMiddleware())
	instructorGroup.Use(m.AuditLogMiddleware())
	{
		instructorGroup.POST("", m.RBACPermission("instructors:create"), r.CreateInstructorHandler)
		instructorGroup.GET("", m.RBACPermission("instructors:list"), r.GetInstructorsHandler)
		instructorGroup.GET("/summary", m.RBACPermission("instructors:list"), r.GetSummaryHandler)
		instructorGroup.GET("/export", m.RBACPermission("instructors:list"), r.ExportInstructorsHandler)
		instructorGroup.GET("/:id", r.GetInstructorByIDHandler)
		instructorGroup.PUT("/:id", m.RBACPermission("instructors:update"), r.UpdateInstructorHandler)
		instructorGroup.DELETE("/:id", m.RBACPermission("instructors:delete"), r.DeleteInstructorHandler)
		instructorGroup.POST("/:id/specialty", m.RBACPermission("instructors:update"), r.AssignInstructorSpecialtyHandler)
		instructorGroup.DELETE("/:id/specialty/:specialty_id", m.RBACPermission("instructors:update"), r.DeleteInstructorSpecialtyHandler)
		instructorGroup.GET("/:id/clients", r.GetAssignedClientsHandler)
	}

	branchInstructorGroup := rg.Group("/branches/:id/instructor")
	branchInstructorGroup.Use(m.AuthJwtTokenMiddleware())
	branchInstructorGroup.Use(m.AuditLogMiddleware())
	{
		branchInstructorGroup.POST("", m.RBACPermission("branch_management"), r.AssignInstructorsToBranchHandler)
		branchInstructorGroup.GET("", m.RBACPermission("instructors:list", "branch_management", "view"), r.ListBranchInstructorsHandler)
		branchInstructorGroup.DELETE("/:instructor_id", m.RBACPermission("branch_management"), r.RemoveInstructorFromBranchHandler)
	}
}
