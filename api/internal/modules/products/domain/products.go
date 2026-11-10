package productsdomain

import (
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
	"gorm.io/gorm"
)

type ServiceCategory struct {
	CategoryID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name       string    `gorm:"type:varchar(100);unique;not null"`

	Services []Service `gorm:"foreignKey:CategoryID"`
}

func (ServiceCategory) TableName() string {
	return "service_categories"
}

type Service struct {
	ServiceID       uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CategoryID      uuid.UUID `gorm:"type:uuid;not null"`
	Name            string    `gorm:"type:varchar(255);unique;not null"`
	Description     string    `gorm:"type:text"`
	DurationMinutes int64     `gorm:"type:int"`
	PriorityScore   int64     `gorm:"type:int;default:50"`
	IsFeatured      bool      `gorm:"type:boolean;default:false;not null"`
	CreatedAt       time.Time `gorm:"default:now()"`
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Category ServiceCategory `gorm:"foreignKey:CategoryID;references:CategoryID"`

	Images []ServiceImage `gorm:"foreignKey:ServiceID"`

	BranchDetails []ServiceBranchDetail    `gorm:"foreignKey:ServiceID"`
	Banners       []marketingdomain.Banner `gorm:"many2many:banner_services;foreignKey:ServiceID;joinForeignKey:ServiceID;References:BannerID;joinReferences:BannerID" json:"banners,omitempty"`
}

func (Service) TableName() string {
	return "services"
}

type ServiceImage struct {
	ImageID      uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ServiceID    uuid.UUID `gorm:"type:uuid;not null"`
	ImageURL     string    `gorm:"type:varchar(255);not null"`
	AltText      string    `gorm:"type:varchar(255)"`
	DisplayOrder int       `gorm:"type:int;not null;default:0"`
	IsPrimary    bool      `gorm:"type:boolean;not null;default:false"`

	Service Service `gorm:"foreignKey:ServiceID"`
}

func (ServiceImage) TableName() string {
	return "service_images"
}

type ServiceBranchDetail struct {
	ServiceID         uuid.UUID `gorm:"type:uuid;not null;primaryKey"`
	BranchID          uuid.UUID `gorm:"type:uuid;not null;primaryKey"`
	IsVisible         bool      `gorm:"type:boolean;not null;default:true"`
	MaxCapacity       int       `gorm:"type:int;not null"`
	PriceForMember    float64   `gorm:"type:decimal(10,2);not null"`
	PriceForNonMember float64   `gorm:"type:decimal(10,2);not null"`
	CreatedAt         time.Time `gorm:"default:now()"`
	UpdatedAt         time.Time
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	Service Service             `gorm:"foreignKey:ServiceID" json:"-"`
	Branch  branchdomain.Branch `gorm:"foreignKey:BranchID" json:"-"`
}

func (ServiceBranchDetail) TableName() string {
	return "service_branch_details"
}

type ServicesSummary struct {
	Total    int64 `json:"total"`
	Actives  int64 `json:"actives"`
	Featured int64 `json:"featured"`
}
type ServiceWithPrice struct {
	Service              `gorm:"embedded"`
	LowestPriceMember    float64 `gorm:"column:lowest_price_member" json:"lowest_price_member"`
	LowestPriceNonMember float64 `gorm:"column:lowest_price_non_member" json:"lowest_price_non_member"`
}

type ClientServiceBalance struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	ServiceID uuid.UUID `gorm:"type:uuid;primaryKey" json:"service_id"`

	Balance   int       `gorm:"not null;default:0;check:balance >= 0" json:"balance"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User    authdomain.Users `gorm:"foreignKey:UserID;references:UserID" json:"-"`
	Service Service          `gorm:"foreignKey:ServiceID;references:ServiceID" json:"service,omitempty"`
}

func (ClientServiceBalance) TableName() string {
	return "client_service_balances"
}
