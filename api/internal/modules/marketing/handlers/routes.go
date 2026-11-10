package marketinghandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type MarketingHandlerInterface interface {
	MarketingRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	CreateBannerHandler(c *gin.Context)
	UpdateBannerHandler(c *gin.Context)
	DeleteBannerHandler(c *gin.Context)
	GetBannerByIDHandler(c *gin.Context)
	GetBannersHandler(c *gin.Context)
	GetRandomBannerHandler(c *gin.Context)
	CreatePromotionHandler(c *gin.Context)
	UpdatePromotionHandler(c *gin.Context)
	DeletePromotionHandler(c *gin.Context)
	GetPromotionByIDHandler(c *gin.Context)
	GetPromotionsHandler(c *gin.Context)
}

type MarketingHandler struct {
	services appservices.Services
}

func NewMarketingHandler(services appservices.Services) *MarketingHandler {
	return &MarketingHandler{services: services}
}

func (r *MarketingHandler) MarketingRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	marketingGroup := rg.Group("/marketing")
	{
		// Public routes (no authentication required)
		marketingGroup.GET("/banners/random", r.GetRandomBannerHandler)

		// Protected routes
		marketingGroup.Use(m.AuthJwtTokenMiddleware())
		marketingGroup.Use(m.AuditLogMiddleware())

		// Banner routes
		bannersGroup := marketingGroup.Group("/banners")
		bannersGroup.POST("", m.RBACPermission("marketing:create"), r.CreateBannerHandler)
		bannersGroup.GET("", m.RBACPermission("marketing:list"), r.GetBannersHandler)
		bannersGroup.GET("/:id", m.RBACPermission("marketing:get"), r.GetBannerByIDHandler)
		bannersGroup.PUT("/:id", m.RBACPermission("marketing:update"), r.UpdateBannerHandler)
		bannersGroup.DELETE("/:id", m.RBACPermission("marketing:delete"), r.DeleteBannerHandler)

		// Promotion routes
		// Access: Super Admin (full CRUD), Admin Franquicia (read and activate/deactivate via update)
		promotionsGroup := marketingGroup.Group("/promotions")
		promotionsGroup.POST("", m.RBACPermission("promotions:create"), r.CreatePromotionHandler)
		promotionsGroup.GET("", m.RBACPermission("promotions:list"), r.GetPromotionsHandler)
		promotionsGroup.GET("/:id", m.RBACPermission("promotions:get"), r.GetPromotionByIDHandler)
		promotionsGroup.PUT("/:id", m.RBACPermission("promotions:update"), r.UpdatePromotionHandler)
		promotionsGroup.DELETE("/:id", m.RBACPermission("promotions:delete"), r.DeletePromotionHandler)
	}
}
