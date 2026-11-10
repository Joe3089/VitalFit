package inventoryhandlers

import (
	"github.com/gin-gonic/gin"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type InventoryHandlersInterface interface {
	InventoryRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)

	// Equipment
	CreateEquipmentHandler(c *gin.Context)
	GetEquipmentsHandler(c *gin.Context)
	ExportEquipmentsHandler(c *gin.Context)
	UpdateEquipmentHandler(c *gin.Context)
	DeleteEquipmentHandler(c *gin.Context)
	GetEquipmentByID(c *gin.Context)

	// Branch inventory
	AddInventoryItemHandler(c *gin.Context)
	ListBranchInventoryHandler(c *gin.Context)
	ExportBranchInventoryHandler(c *gin.Context)
	UpdateInventoryItemHandler(c *gin.Context)
	DeleteInventoryItemHandler(c *gin.Context)
	GetInventoryByID(c *gin.Context)
}

type InventoryHandlers struct {
	services appservices.Services
}

// Constructor
func NewInventoryHandlers(services appservices.Services) *InventoryHandlers {
	return &InventoryHandlers{services: services}
}

func (r *InventoryHandlers) InventoryRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	// ==============================
	//  EQUIPMENT CATALOG
	// ==============================
	equipmentGroup := rg.Group("/equipment-types").
		Use(m.AuthJwtTokenMiddleware()).
		Use(m.AuditLogMiddleware())

	{
		equipmentGroup.POST("", r.CreateEquipmentHandler)
		equipmentGroup.GET("", r.GetEquipmentsHandler)
		equipmentGroup.GET("/export", r.ExportEquipmentsHandler)
		equipmentGroup.PUT("/:id", r.UpdateEquipmentHandler)
		equipmentGroup.GET("/:id", r.GetEquipmentByID)
		equipmentGroup.DELETE("/:id", r.DeleteEquipmentHandler)
	}

	// ==============================
	//  BRANCH INVENTORY
	// ==============================
	branchInventoryGroup := rg.Group("/branches/:id/equipment").
		Use(m.AuthJwtTokenMiddleware()).
		Use(m.AuditLogMiddleware())

	{
		branchInventoryGroup.POST("", m.RBACPermission("branch_management"), r.AddInventoryItemHandler)
		branchInventoryGroup.GET("", m.RBACPermission("branch_management"), r.ListBranchInventoryHandler)
		branchInventoryGroup.GET("/export", m.RBACPermission("branch_management"), r.ExportBranchInventoryHandler)
		branchInventoryGroup.GET("/:inventoryId", m.RBACPermission("branch_management"), r.GetInventoryByID)
		branchInventoryGroup.PATCH("/:inventoryId", m.RBACPermission("branch_management"), r.UpdateInventoryItemHandler)
		branchInventoryGroup.DELETE("/:inventoryId", m.RBACPermission("branch_management"), r.DeleteInventoryItemHandler)
	}
}
