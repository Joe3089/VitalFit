package combosdomain

import (
	"time"

	"github.com/google/uuid"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	"gorm.io/gorm"
)

type Package struct {
	PackageID   uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string     `gorm:"type:varchar(255);not null"`
	Description string     `gorm:"type:text"`
	Price       float64    `gorm:"type:decimal(10,2);not null"`
	IsActive    bool       `gorm:"not null;default:true"`
	StartAt     *time.Time `gorm:"type:timestamptz"`
	EndAt       *time.Time `gorm:"type:timestamptz"`
	CreatedAt   time.Time  `gorm:"default:now()"`
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`

	PackageItems []PackageItem `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE"`
}

func (Package) TableName() string {
	return "packages"
}

type PackageItem struct {
	PackageID        uuid.UUID `gorm:"type:uuid;primary_key"`
	ServiceID        uuid.UUID `gorm:"type:uuid;primary_key"`
	SessionsIncluded int       `gorm:"not null;default:10"`

	Package Package                `gorm:"foreignKey:PackageID"`
	Service productsdomain.Service `gorm:"foreignKey:ServiceID"`
}

func (PackageItem) TableName() string {
	return "package_items"
}
