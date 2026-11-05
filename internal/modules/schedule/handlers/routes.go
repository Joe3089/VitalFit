package schedulehandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type ScheduleHandlersInterface interface {
	ScheduleRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)

	CreateClassHandler(c *gin.Context)
	GetClassesByBranchHandler(c *gin.Context)
	UpdateClassHandler(c *gin.Context)
	DeleteClassHandler(c *gin.Context)
	GetClassByIDHandler(c *gin.Context)
	GetClassesByInstructorHandler(c *gin.Context)
	GetClassAttendanceHistoryHandler(c *gin.Context)
}

type ScheduleHandlers struct {
	services appservices.Services
}

func NewScheduleHandlers(services appservices.Services) *ScheduleHandlers {
	return &ScheduleHandlers{services: services}
}

func (h *ScheduleHandlers) ScheduleRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

	branchSchedule := rg.Group("/branches/:id/schedule")
	{
		branchSchedule.Use(m.AuthJwtTokenMiddleware())
		branchSchedule.Use(m.AuditLogMiddleware())

		branchSchedule.POST("", m.RBACPermission("schedule:create"), h.CreateClassHandler)
		branchSchedule.GET("", h.GetClassesByBranchHandler)
	}

	classRoutes := rg.Group("/schedule")
	{
		classRoutes.Use(m.AuthJwtTokenMiddleware())
		classRoutes.Use(m.AuditLogMiddleware())

		classRoutes.GET("/instructor", h.GetClassesByInstructorHandler)
		classRoutes.GET("/:classId", h.GetClassByIDHandler)
		classRoutes.PUT("/:classId", m.RBACPermission("schedule:update"), h.UpdateClassHandler)
		classRoutes.DELETE("/:classId", m.RBACPermission("schedule:delete"), h.DeleteClassHandler)
		classRoutes.PATCH("/:classId/cancel", m.RBACPermission("schedule:cancel"), h.CancelClassHandler)
	}

	// Class-specific routes
	classesGroup := rg.Group("/classes")
	{
		classesGroup.Use(m.AuthJwtTokenMiddleware())
		classesGroup.Use(m.AuditLogMiddleware())

		// Attendance history - accessible by branch admins
		classesGroup.GET("/:id/attendance/history", m.RBACPermission("schedule:view_attendance"), h.GetClassAttendanceHistoryHandler)
	}
}
