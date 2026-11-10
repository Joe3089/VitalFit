package marketingdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type MarketingRepository interface {
	// Banner operations
	CreateBanner(context.Context, *Banner) error
	CreateBannerTX(context.Context, *gorm.DB, *Banner) error
	UpdateBanner(context.Context, *Banner) error
	DeleteBanner(context.Context, uuid.UUID) error
	GetBannerByID(context.Context, uuid.UUID) (*Banner, error)
	GetBanners(context.Context) ([]*Banner, error)

	// Banner-Service operations
	GetRandomBannerWithService(context.Context) (*Banner, uuid.UUID, error)

	// Promotion operations
	CreatePromotion(context.Context, *Promotion) error
	UpdatePromotion(context.Context, *Promotion) error
	DeletePromotion(context.Context, uuid.UUID) error
	GetPromotionByID(context.Context, uuid.UUID) (*Promotion, error)
	GetPromotions(context.Context, pagination.PaginatedFeedQuery) ([]*Promotion, int64, error)
	GetPromotionByCode(context.Context, string) (*Promotion, error)
}
