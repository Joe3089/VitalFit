package inventorydomain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type EquipmentCategoryEnum string

const (
	EquipmentCategoryCardio     EquipmentCategoryEnum = "Cardio"
	EquipmentCategoryStrength   EquipmentCategoryEnum = "Strength"
	EquipmentCategoryFreeWeight EquipmentCategoryEnum = "FreeWeight"
	EquipmentCategoryFunctional EquipmentCategoryEnum = "Functional"
	EquipmentCategoryAccessory  EquipmentCategoryEnum = "Accessory"
)

type Equipment struct {
	EquipmentID uuid.UUID             `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"equipment_id"`
	Name        string                `gorm:"type:varchar(255);not null;uniqueIndex:idx_equipment_name_brand_model" json:"name"`
	Category    EquipmentCategoryEnum `gorm:"type:equipment_category_enum;not null" json:"category"`
	Description string                `gorm:"type:text" json:"description"`
	Brand       string                `gorm:"type:varchar(100)" json:"brand"`
	Model       string                `gorm:"type:varchar(100)" json:"model"`
	CreatedAt   time.Time             `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time             `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   gorm.DeletedAt        `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`
}

type EquipmentQueryResults struct {
	Equipments []*Equipment
}

type EquipmentRepository interface {
	Create(ctx context.Context, equipment *Equipment) (*Equipment, error)
	GetAll(ctx context.Context, fq pagination.PaginatedFeedQuery) (*EquipmentQueryResults, error)
	GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	Update(ctx context.Context, equipment *Equipment) error
	Delete(ctx context.Context, equipmentID uuid.UUID) error
	GetByID(ctx context.Context, equipmentID uuid.UUID) (*Equipment, error)
	GetAllEquipments(ctx context.Context) ([]*Equipment, error)
}

type EquipmentServicesInterface interface {
	CreateEquipment(ctx context.Context, equipment *Equipment) error
	GetEquipments(ctx context.Context, fq pagination.PaginatedFeedQuery) (*EquipmentQueryResults, error)
	GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	UpdateEquipment(ctx context.Context, equipment *Equipment) error
	DeleteEquipment(ctx context.Context, equipmentID uuid.UUID) error
	GetEquipmentByID(ctx context.Context, equipmentID uuid.UUID) (*Equipment, error)
}
