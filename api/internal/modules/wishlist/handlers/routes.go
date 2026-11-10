package wishlisthandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type WishlistRoutes interface {
	SetupRoutes(router *gin.RouterGroup, m *auth.AuthMiddleware)
}

func (h *WishlistHandlers) SetupRoutes(router *gin.RouterGroup, m *auth.AuthMiddleware) {
	wishlistRoutes := router.Group("/wishlist")
	wishlistRoutes.Use(m.AuthJwtTokenMiddleware())
	wishlistRoutes.Use(m.AuditLogMiddleware())
	{
		wishlistRoutes.POST("", h.AddToWishlistHandler)
		wishlistRoutes.DELETE("/:id", h.RemoveFromWishlistHandler)
		wishlistRoutes.GET("", h.GetUserWishlistHandler)
	}
}

func NewWishlistRoutes(services appservices.Services) WishlistRoutes {
	return NewWishlistHandlers(services)
}
