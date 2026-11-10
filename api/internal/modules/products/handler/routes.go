package productshandler

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type ProductsHandlerInterface interface {
	ProductsRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	PublicProductsRoutes(rg *gin.RouterGroup)

	ListServiceCategoriesHandler(c *gin.Context)
	CreateServiceHandler(c *gin.Context)
	GetServicesHandler(c *gin.Context)
	GetSummaryServicesHandler(c *gin.Context)
	DeleteServiceHandler(c *gin.Context)
	ExportServicesHandler(c *gin.Context)
	GetServiceByIDHandler(c *gin.Context)
	UpdateServiceHandler(c *gin.Context)

	AssignBranchServiceHandler(c *gin.Context)
	GetBranchServiceHandler(c *gin.Context)
	UpdateBranchServiceHandler(c *gin.Context)
	DeleteBranchServiceHandler(c *gin.Context)
	GetBranchServiceByIDHandler(c *gin.Context)
	ExportBranchServicesHandler(c *gin.Context)

	PublicGetServicesHandler(c *gin.Context)
	PublicGetBranchServicesHandler(c *gin.Context)
	GetClientBalancesHandler(c *gin.Context)
}

type ProductsHandler struct {
	services appservices.Services
}

func NewProductsHandler(services appservices.Services) *ProductsHandler {
	return &ProductsHandler{services: services}
}

func (r *ProductsHandler) ProductsRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	ProductGroup := rg.Group("/services")
	{
		ProductGroup.Use(m.AuthJwtTokenMiddleware())
		ProductGroup.Use(m.AuditLogMiddleware())
		ProductGroup.GET("/categories", m.RBACPermission("services:list"), r.ListServiceCategoriesHandler)
		ProductGroup.GET("/all", m.RBACPermission("services:list"), r.GetServicesHandler)
		ProductGroup.GET("/summary", m.RBACPermission("services:list"), r.GetSummaryServicesHandler)
		ProductGroup.GET("/export", m.RBACPermission("services:list"), r.ExportServicesHandler)

		ProductGroup.POST("", m.RBACPermission("services:create"), r.CreateServiceHandler)
		ProductGroup.GET("/:id", r.GetServiceByIDHandler)
		ProductGroup.DELETE("/:id", m.RBACPermission("services:delete"), r.DeleteServiceHandler)
		ProductGroup.PUT("/:id", m.RBACPermission("services:update"), r.UpdateServiceHandler)
		ProductGroup.GET("/balances", r.GetClientBalancesHandler)
	}

	BranchServicesGroup := rg.Group("/branches/:id/services")
	{
		BranchServicesGroup.Use(m.AuthJwtTokenMiddleware())
		BranchServicesGroup.Use(m.AuditLogMiddleware())
		BranchServicesGroup.POST("", m.RBACPermission("branch_management"), r.AssignBranchServiceHandler)
		BranchServicesGroup.GET("", m.RBACPermission("branch_management", "view"), r.GetBranchServiceHandler)
		BranchServicesGroup.GET("/export", m.RBACPermission("branch_management", "view"), r.ExportBranchServicesHandler)
		BranchServicesGroup.GET("/:service_id", m.RBACPermission("branch_management", "view"), r.GetBranchServiceByIDHandler)
		BranchServicesGroup.PUT("/:service_id", m.RBACPermission("branch_management"), r.UpdateBranchServiceHandler)
		BranchServicesGroup.DELETE("/:service_id", m.RBACPermission("branch_management"), r.DeleteBranchServiceHandler)
	}
}

func (r *ProductsHandler) PublicProductsRoutes(rg *gin.RouterGroup) {
	publicServicesGroup := rg.Group("/public")
	{
		publicServicesGroup.GET("/services", r.PublicGetServicesHandler)
		publicServicesGroup.GET("/branches/:id/services", r.PublicGetBranchServicesHandler)
	}
}
