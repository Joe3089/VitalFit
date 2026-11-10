package inventorydomain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EquipmentStatusEnum string

const (
	EquipmentAvailable     EquipmentStatusEnum = "Available"
	EquipmentInMaintenance EquipmentStatusEnum = "InMaintenance"
	EquipmentOutOfService  EquipmentStatusEnum = "OutOfService"
)

type BranchInventory struct {
	InventoryID         uuid.UUID           `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"inventory_id"`
	BranchID            uuid.UUID           `gorm:"type:uuid;not null" json:"branch_id"`
	EquipmentID         uuid.UUID           `gorm:"type:uuid;not null" json:"equipment_id"`
	SerialNumber        string              `gorm:"type:varchar(255);uniqueIndex" json:"serial_number"`
	Status              EquipmentStatusEnum `gorm:"type:inventory_status;not null;default:'Available'" json:"status"`
	AcquisitionDate     *time.Time          `gorm:"type:date" json:"acquisition_date,omitempty"`
	LastMaintenanceDate *time.Time          `gorm:"type:date" json:"last_maintenance_date,omitempty"`
	Notes               string              `gorm:"type:text" json:"notes"`
	CreatedAt           time.Time           `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt           time.Time           `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt           gorm.DeletedAt      `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`
	Equipment           *Equipment          `gorm:"foreignKey:EquipmentID;references:EquipmentID" json:"equipment,omitempty"`
}
