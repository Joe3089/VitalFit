package marketingservice

import (
	"context"

	"github.com/google/uuid"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type MarketingService struct {
	store store.Storage
}

func NewMarketingService(store store.Storage) *MarketingService {
	return &MarketingService{
		store: store,
	}
}

func (s *MarketingService) CreateBanner(ctx context.Context, banner *marketingdomain.Banner) error {
	err := s.store.Marketing.CreateBanner(ctx, banner)
	if err != nil {
		return err
	}
	return nil
}

func (s *MarketingService) UpdateBanner(ctx context.Context, banner *marketingdomain.Banner) error {
	err := s.store.Marketing.UpdateBanner(ctx, banner)
	if err != nil {
		return err
	}
	return nil
}

func (s *MarketingService) DeleteBanner(ctx context.Context, bannerID uuid.UUID) error {
	err := s.store.Marketing.DeleteBanner(ctx, bannerID)
	if err != nil {
		return err
	}
	return nil
}

func (s *MarketingService) GetBannerByID(ctx context.Context, bannerID uuid.UUID) (*marketingdomain.Banner, error) {
	banner, err := s.store.Marketing.GetBannerByID(ctx, bannerID)
	if err != nil {
		return nil, err
	}
	return banner, nil
}

func (s *MarketingService) GetBanners(ctx context.Context) ([]*marketingdomain.Banner, error) {
	banners, err := s.store.Marketing.GetBanners(ctx)
	if err != nil {
		return nil, err
	}
	return banners, nil
}

func (s *MarketingService) GetRandomBannerWithService(ctx context.Context) (*marketingdomain.Banner, uuid.UUID, error) {
	banner, serviceID, err := s.store.Marketing.GetRandomBannerWithService(ctx)
	if err != nil {
		return nil, uuid.Nil, err
	}
	return banner, serviceID, nil
}

// Promotion operations

func (s *MarketingService) CreatePromotion(ctx context.Context, promotion *marketingdomain.Promotion) error {
	// Check if code already exists
	if promotion.Code != "" {
		existing, err := s.store.Marketing.GetPromotionByCode(ctx, promotion.Code)
		if err == nil && existing != nil {
			return err
		}
	}

	err := s.store.Marketing.CreatePromotion(ctx, promotion)
	if err != nil {
		return err
	}
	return nil
}

func (s *MarketingService) UpdatePromotion(ctx context.Context, promotion *marketingdomain.Promotion) error {
	err := s.store.Marketing.UpdatePromotion(ctx, promotion)
	if err != nil {
		return err
	}
	return nil
}

func (s *MarketingService) DeletePromotion(ctx context.Context, promotionID uuid.UUID) error {
	err := s.store.Marketing.DeletePromotion(ctx, promotionID)
	if err != nil {
		return err
	}
	return nil
}

func (s *MarketingService) GetPromotionByID(ctx context.Context, promotionID uuid.UUID) (*marketingdomain.Promotion, error) {
	promotion, err := s.store.Marketing.GetPromotionByID(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	return promotion, nil
}

func (s *MarketingService) GetPromotions(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*marketingdomain.Promotion, int64, error) {
	promotions, total, err := s.store.Marketing.GetPromotions(ctx, fq)
	if err != nil {
		return nil, 0, err
	}
	return promotions, total, nil
}
