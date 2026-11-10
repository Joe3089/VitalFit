package marketingdomain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DiscountType string

const (
	DiscountTypePercentage  DiscountType = "Percentage"
	DiscountTypeFixedAmount DiscountType = "FixedAmount"
)

type Banner struct {
	BannerID uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"banner_id"`
	Name     string    `gorm:"type:varchar(255);not null" json:"name"`
	ImageURL string    `gorm:"type:varchar(255);not null" json:"image_url"`
	LinkURL  string    `gorm:"type:varchar(255)" json:"link_url"`
	IsActive bool      `gorm:"not null;default:true" json:"is_active"`
}

func (Banner) TableName() string {
	return "banners"
}

type BannerService struct {
	BannerID  uuid.UUID `gorm:"primaryKey"`
	ServiceID uuid.UUID `gorm:"primaryKey"`
}

func (BannerService) TableName() string {
	return "banner_services"
}

type Promotion struct {
	PromotionID   uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"promotion_id"`
	Name          string         `gorm:"type:varchar(255);not null" json:"name"`
	Code          string         `gorm:"type:varchar(50);unique" json:"code"`
	DiscountType  DiscountType   `gorm:"type:varchar(50);not null" json:"discount_type"`
	DiscountValue float64        `gorm:"type:decimal(10,2);not null" json:"discount_value"`
	StartDate     time.Time      `gorm:"not null" json:"start_date"`
	EndDate       time.Time      `gorm:"not null" json:"end_date"`
	IsActive      bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt     time.Time      `gorm:"default:now()" json:"created_at"`
	UpdatedAt     *time.Time     `json:"updated_at,omitempty"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`
}

func (Promotion) TableName() string {
	return "promotions"
}

type PromotionMembership struct {
	PromotionID      uuid.UUID `gorm:"primaryKey" json:"promotion_id"`
	MembershipTypeID uuid.UUID `gorm:"primaryKey" json:"membership_type_id"`
}

func (PromotionMembership) TableName() string {
	return "promotion_memberships"
}

type PromotionService struct {
	PromotionID uuid.UUID `gorm:"primaryKey" json:"promotion_id"`
	ServiceID   uuid.UUID `gorm:"primaryKey" json:"service_id"`
}

func (PromotionService) TableName() string {
	return "promotion_services"
}
