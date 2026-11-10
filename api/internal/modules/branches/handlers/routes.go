package branchhandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type BranchHandlersInterface interface {
	BranchRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	CreateBranchHandler(c *gin.Context)
	GetBranchesHandler(c *gin.Context)
	DeleteBranchHandler(c *gin.Context)
	GetBranchByIDHandler(c *gin.Context)
	UpdateBranchHandler(c *gin.Context)
	GetBranchStatusCount(c *gin.Context)
	GetPublicBranchesMapHandler(c *gin.Context)
	PublicBranchRoutes(rg *gin.RouterGroup)
}

type BranchHandlers struct {
	services appservices.Services
}

func NewBranchHandlers(services appservices.Services) *BranchHandlers {
	return &BranchHandlers{services: services}
}

func (r *BranchHandlers) BranchRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

	branchGroup := rg.Group("/branches").
		Use(m.AuthJwtTokenMiddleware()).
		Use(m.AuditLogMiddleware())

	{
		branchGroup.GET("", m.RBACPermission("branches:list"), r.GetBranchesHandler)
		branchGroup.GET("/:id", m.RBACPermission("branches:get"), r.GetBranchByIDHandler)
		branchGroup.POST("", m.RBACPermission("branches:create"), r.CreateBranchHandler)
		branchGroup.PUT("/:id", m.RBACPermission("branches:update"), r.UpdateBranchHandler)
		branchGroup.DELETE("/:id", m.RBACPermission("branches:delete"), r.DeleteBranchHandler)

		branchGroup.GET("/status", m.RBACPermission("branches:list"), r.GetBranchStatusCount)
	}
}

func (r *BranchHandlers) PublicBranchRoutes(rg *gin.RouterGroup) {
	publicGroup := rg.Group("/public")
	{
		publicGroup.GET("/branches-map", r.GetPublicBranchesMapHandler)
	}
}
