package bookinghandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type BookingHandlersInterface interface {
	BookingRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)

	GetClientScheduleHandler(c *gin.Context)
	CreateBookingHandler(c *gin.Context)
	CancelBookingHandler(c *gin.Context)
	GetClassBookingsCountHandler(c *gin.Context)
	GetBookingsByClassHandler(c *gin.Context)
}

type BookingHandlers struct {
	services appservices.Services
}

func NewBookingHandlers(services appservices.Services) *BookingHandlers {
	return &BookingHandlers{services: services}
}

func (h *BookingHandlers) BookingRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

	scheduleRoutes := rg.Group("/schedule")
	{
		scheduleRoutes.Use(m.AuthJwtTokenMiddleware())
		scheduleRoutes.Use(m.AuditLogMiddleware())
		scheduleRoutes.GET("/branch/:branchId/client", h.GetClientScheduleHandler)
		scheduleRoutes.GET("/branch/:branchId/client/:userId", h.GetClientScheduleHandler)
		scheduleRoutes.POST("/:classId/book", h.CreateBookingHandler)
		scheduleRoutes.GET("/:classId/bookings/count", h.GetClassBookingsCountHandler)
	}

	bookingRoutes := rg.Group("/bookings")
	{
		bookingRoutes.Use(m.AuthJwtTokenMiddleware())
		bookingRoutes.Use(m.AuditLogMiddleware())
		bookingRoutes.GET("/client", h.GetClientBookingsHandler)
		bookingRoutes.GET("/client/:userId", h.GetClientBookingsHandler)
		bookingRoutes.PATCH("/:bookingId/cancel", h.CancelBookingHandler)
		bookingRoutes.GET("/class/:classId", m.RBACPermission("booking:list"), h.GetBookingsByClassHandler)
	}
}
