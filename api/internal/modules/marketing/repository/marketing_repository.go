package marketingrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type MarketingStore struct {
	db *gorm.DB
}

func NewMarketingStore(db *gorm.DB) *MarketingStore {
	return &MarketingStore{
		db: db,
	}
}

func (s *MarketingStore) CreateBanner(ctx context.Context, banner *marketingdomain.Banner) error {
	err := s.db.WithContext(ctx).Create(banner).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	return nil
}

func (s *MarketingStore) CreateBannerTX(ctx context.Context, tx *gorm.DB, banner *marketingdomain.Banner) error {
	err := tx.WithContext(ctx).Create(banner).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	return nil
}

func (s *MarketingStore) UpdateBanner(ctx context.Context, banner *marketingdomain.Banner) error {
	err := s.db.Save(banner).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *MarketingStore) DeleteBanner(ctx context.Context, bannerID uuid.UUID) error {
	err := s.db.Delete(&marketingdomain.Banner{}, bannerID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *MarketingStore) GetBannerByID(ctx context.Context, bannerID uuid.UUID) (*marketingdomain.Banner, error) {
	banner := &marketingdomain.Banner{}
	err := s.db.First(banner, bannerID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return banner, nil
}

func (s *MarketingStore) GetBanners(ctx context.Context) ([]*marketingdomain.Banner, error) {
	banners := []*marketingdomain.Banner{}
	err := s.db.Find(&banners).Error
	if err != nil {
		return nil, err
	}
	return banners, nil
}

func (s *MarketingStore) GetRandomBannerWithService(ctx context.Context) (*marketingdomain.Banner, uuid.UUID, error) {
	type Result struct {
		BannerID  uuid.UUID `gorm:"column:banner_id"`
		Name      string    `gorm:"column:name"`
		ImageURL  string    `gorm:"column:image_url"`
		LinkURL   string    `gorm:"column:link_url"`
		IsActive  bool      `gorm:"column:is_active"`
		ServiceID uuid.UUID `gorm:"column:service_id"`
	}

	var result Result

	// Query to get a random active banner that has at least one associated service
	err := s.db.WithContext(ctx).
		Table("banners").
		Select("banners.banner_id, banners.name, banners.image_url, banners.link_url, banners.is_active, banner_services.service_id").
		Joins("INNER JOIN banner_services ON banners.banner_id = banner_services.banner_id").
		Where("banners.is_active = ?", true).
		Order("RANDOM()").
		Limit(1).
		Scan(&result).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, uuid.Nil, shared_errors.ErrNotFound
		}
		return nil, uuid.Nil, err
	}

	if result.BannerID == uuid.Nil {
		return nil, uuid.Nil, shared_errors.ErrNotFound
	}

	banner := &marketingdomain.Banner{
		BannerID: result.BannerID,
		Name:     result.Name,
		ImageURL: result.ImageURL,
		LinkURL:  result.LinkURL,
		IsActive: result.IsActive,
	}

	return banner, result.ServiceID, nil
}

// Promotion operations

func (s *MarketingStore) CreatePromotion(ctx context.Context, promotion *marketingdomain.Promotion) error {
	err := s.db.WithContext(ctx).Create(promotion).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	return nil
}

func (s *MarketingStore) UpdatePromotion(ctx context.Context, promotion *marketingdomain.Promotion) error {
	err := s.db.WithContext(ctx).Save(promotion).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *MarketingStore) DeletePromotion(ctx context.Context, promotionID uuid.UUID) error {
	err := s.db.WithContext(ctx).Delete(&marketingdomain.Promotion{}, promotionID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *MarketingStore) GetPromotionByID(ctx context.Context, promotionID uuid.UUID) (*marketingdomain.Promotion, error) {
	promotion := &marketingdomain.Promotion{}
	err := s.db.WithContext(ctx).First(promotion, promotionID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return promotion, nil
}

func (s *MarketingStore) GetPromotions(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*marketingdomain.Promotion, int64, error) {
	promotions := []*marketingdomain.Promotion{}
	var count int64

	tx := s.db.WithContext(ctx).Model(&marketingdomain.Promotion{})

	if fq.Search != "" {
		tx = tx.Where("name ILIKE ? OR code ILIKE ?", "%"+fq.Search+"%", "%"+fq.Search+"%")
	}

	if err := tx.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	if fq.Sort != "" && fq.Sortby != "" {
		tx = tx.Order(fq.Sortby + " " + fq.Sort)
	} else {
		tx = tx.Order("created_at desc")
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := tx.Limit(fq.Limit).Offset((page - 1) * fq.Limit).Find(&promotions).Error
	if err != nil {
		return nil, 0, err
	}
	return promotions, count, nil
}

func (s *MarketingStore) GetPromotionByCode(ctx context.Context, code string) (*marketingdomain.Promotion, error) {
	promotion := &marketingdomain.Promotion{}
	err := s.db.WithContext(ctx).Where("code = ?", code).First(promotion).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return promotion, nil
}
