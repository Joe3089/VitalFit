package inventoryhandlers

import (
	"time"

	"github.com/google/uuid"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
)

// -----------------------------
// EQUIPMENT PAYLOADS (Super Admin)
// -----------------------------

type CreateEquipmentPayload struct {
	Name        string `json:"name" binding:"required,min=2"`
	Category    string `json:"category" binding:"required,oneof=Cardio Strength FreeWeight Functional Accessory"`
	Description string `json:"description" binding:"omitempty"`
	Brand       string `json:"brand" binding:"omitempty"`
	Model       string `json:"model" binding:"omitempty"`
}

func (p *CreateEquipmentPayload) ToEquipment() (*inventorydomain.Equipment, error) {
	eq := &inventorydomain.Equipment{
		Name:        p.Name,
		Category:    inventorydomain.EquipmentCategoryEnum(p.Category),
		Description: p.Description,
		Brand:       p.Brand,
		Model:       p.Model,
	}
	return eq, nil
}

type UpdateEquipmentPayload struct {
	Name        string `json:"name" binding:"required,min=2"`
	Category    string `json:"category" binding:"required,oneof=Cardio Strength FreeWeight Functional Accessory"`
	Description string `json:"description" binding:"omitempty"`
	Brand       string `json:"brand" binding:"omitempty"`
	Model       string `json:"model" binding:"omitempty"`
}

func (p *UpdateEquipmentPayload) ToEquipment() (*inventorydomain.Equipment, error) {
	eq := &inventorydomain.Equipment{
		Name:        p.Name,
		Category:    inventorydomain.EquipmentCategoryEnum(p.Category),
		Description: p.Description,
		Brand:       p.Brand,
		Model:       p.Model,
	}
	return eq, nil
}

// -----------------------------
// BRANCH INVENTORY PAYLOADS (Branch Admin)
// -----------------------------

type CreateInventoryItemPayload struct {
	EquipmentID         uuid.UUID `json:"equipment_id" binding:"required"`
	SerialNumber        string    `json:"serial_number" binding:"omitempty"`
	Status              string    `json:"status" binding:"omitempty,oneof=Available InMaintenance OutOfService"`
	AcquisitionDate     string    `json:"acquisition_date" binding:"omitempty,datetime=2006-01-02"`
	LastMaintenanceDate string    `json:"last_maintenance_date" binding:"omitempty,datetime=2006-01-02"`
	Notes               string    `json:"notes" binding:"omitempty"`
}

func (p *CreateInventoryItemPayload) ToBranchInventory(branchID uuid.UUID) (*inventorydomain.BranchInventory, error) {
	var acquisitionDate *time.Time
	var maintenanceDate *time.Time

	if p.AcquisitionDate != "" {
		t, err := time.Parse("2006-01-02", p.AcquisitionDate)
		if err == nil {
			acquisitionDate = &t
		}
	}
	if p.LastMaintenanceDate != "" {
		t, err := time.Parse("2006-01-02", p.LastMaintenanceDate)
		if err == nil {
			maintenanceDate = &t
		}
	}

	item := &inventorydomain.BranchInventory{
		BranchID:            branchID,
		EquipmentID:         p.EquipmentID,
		SerialNumber:        p.SerialNumber,
		Status:              inventorydomain.EquipmentStatusEnum(p.Status),
		AcquisitionDate:     acquisitionDate,
		LastMaintenanceDate: maintenanceDate,
		Notes:               p.Notes,
	}
	if item.Status == "" {
		item.Status = inventorydomain.EquipmentAvailable
	}
	return item, nil
}

type UpdateInventoryItemPayload struct {
	Status              string `json:"status" binding:"omitempty,oneof=Available InMaintenance OutOfService"`
	LastMaintenanceDate string `json:"last_maintenance_date" binding:"omitempty,datetime=2006-01-02"`
	Notes               string `json:"notes" binding:"omitempty"`
}

func (p *UpdateInventoryItemPayload) ToBranchInventoryUpdate(inventoryID uuid.UUID) (*inventorydomain.BranchInventory, error) {
	var maintenanceDate *time.Time
	if p.LastMaintenanceDate != "" {
		t, err := time.Parse("2006-01-02", p.LastMaintenanceDate)
		if err == nil {
			maintenanceDate = &t
		}
	}

	item := &inventorydomain.BranchInventory{
		InventoryID:         inventoryID,
		Status:              inventorydomain.EquipmentStatusEnum(p.Status),
		LastMaintenanceDate: maintenanceDate,
		Notes:               p.Notes,
	}
	return item, nil
}

// -----------------------------
// RESPONSES
// -----------------------------

type EquipmentListResponse struct {
	EquipmentID uuid.UUID `json:"equipment_id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	Brand       string    `json:"brand"`
	Model       string    `json:"model"`
	Description string    `json:"description"`
}

type BranchInventoryResponse struct {
	InventoryID         uuid.UUID `json:"inventory_id"`
	EquipmentID         uuid.UUID `json:"equipment_id"`
	Name                string    `json:"name"`
	SerialNumber        string    `json:"serial_number"`
	Status              string    `json:"status"`
	AcquisitionDate     string    `json:"acquisition_date,omitempty"`
	LastMaintenanceDate string    `json:"last_maintenance_date,omitempty"`
	Notes               string    `json:"notes,omitempty"`
}
