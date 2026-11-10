package comboshandler

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type CombosHandlerInterface interface {
	CombosRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	PublicCombosRoutes(rg *gin.RouterGroup)

	CreatePackageHandler(c *gin.Context)
	GetPackageHandler(c *gin.Context)
	GetPackageByIDHandler(c *gin.Context)
	UpdatePackageHandler(c *gin.Context)
	DeletePackageHandler(c *gin.Context)
	ExportPackagesHandler(c *gin.Context)

	PublicGetPackagesHandler(c *gin.Context)
}

type CombosHandler struct {
	services appservices.Services
}

func NewCombosHandler(services appservices.Services) *CombosHandler {
	return &CombosHandler{services: services}
}

func (r *CombosHandler) CombosRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	packagesGroup := rg.Group("/packages")
	{
		packagesGroup.Use(m.AuthJwtTokenMiddleware())
		packagesGroup.Use(m.AuditLogMiddleware())
		packagesGroup.POST("", m.RBACPermission("packages:create"), r.CreatePackageHandler)
		packagesGroup.GET("", m.RBACPermission("packages:list"), r.GetPackageHandler)
		packagesGroup.GET("/export", m.RBACPermission("packages:list"), r.ExportPackagesHandler)
		packagesGroup.GET("/:id", m.RBACPermission("packages:get"), r.GetPackageByIDHandler)
		packagesGroup.PUT("/:id", m.RBACPermission("packages:update"), r.UpdatePackageHandler)
		packagesGroup.DELETE("/:id", m.RBACPermission("packages:delete"), r.DeletePackageHandler)
	}
}

func (r *CombosHandler) PublicCombosRoutes(rg *gin.RouterGroup) {
	publicPackagesGroup := rg.Group("/public")
	{
		publicPackagesGroup.GET("/packages", r.PublicGetPackagesHandler)
	}
}
