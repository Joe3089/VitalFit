package routinehandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type RoutineHandlersInterface interface {
	RoutineRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
}

type RoutineHandlers struct {
	services appservices.Services
}

func NewRoutineHandlers(services appservices.Services) *RoutineHandlers {
	return &RoutineHandlers{services: services}
}

func (h *RoutineHandlers) RoutineRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	routinesGroup := rg.Group("/routines")
	routinesGroup.Use(m.AuthJwtTokenMiddleware())
	routinesGroup.Use(m.AuditLogMiddleware())

	// Admin/Instructor routes
	routinesGroup.POST("", m.RBACPermission("routines:create"), h.CreateRoutineHandler)
	routinesGroup.GET("", m.RBACPermission("routines:list"), h.GetAllRoutinesHandler)
	routinesGroup.GET("/my-created", h.GetInstructorRoutinesHandler)
	routinesGroup.GET("/:id", h.GetRoutineByIDHandler)
	routinesGroup.DELETE("/:id", h.DeleteRoutineHandler)
	routinesGroup.PUT("/:id", m.RBACPermission("routines:update"), h.UpdateRoutineHandler)
	routinesGroup.POST("/assign", m.RBACPermission("routines:assign"), h.AssignRoutineHandler)
	routinesGroup.GET("/client/:id", m.RBACPermission("routines:read"), h.GetClientRoutinesHandler)

	// Client routes
	routinesGroup.GET("/my-routines", h.GetMyRoutinesHandler)
	routinesGroup.POST("/my-routines/:id/complete", h.MarkRoutineCompletionHandler)

	exercisesGroup := rg.Group("/exercises")
	exercisesGroup.Use(m.AuthJwtTokenMiddleware())
	exercisesGroup.Use(m.AuditLogMiddleware())
	exercisesGroup.POST("", m.RBACPermission("routines:create"), h.CreateExerciseHandler)
	exercisesGroup.GET("", m.RBACPermission("routines:read"), h.GetExercisesHandler)
}
