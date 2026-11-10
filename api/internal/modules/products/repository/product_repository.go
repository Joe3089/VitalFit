package productsrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProductsStore struct {
	db *gorm.DB
}

func NewProductsStore(db *gorm.DB) *ProductsStore {
	return &ProductsStore{
		db: db,
	}
}

func (s *ProductsStore) CreateServiceCategory(ctx context.Context, tx *gorm.DB, serviceCategory *productsdomain.ServiceCategory) error {
	if err := tx.Create(serviceCategory).Error; err != nil {
		return err
	}
	return nil
}

func (s *ProductsStore) ListServiceCategories(ctx context.Context, tx *gorm.DB) ([]productsdomain.ServiceCategory, error) {
	var serviceCategories []productsdomain.ServiceCategory
	if err := tx.Find(&serviceCategories).Error; err != nil {
		return nil, err
	}
	return serviceCategories, nil
}

func (s *ProductsStore) GetServicesCategories(ctx context.Context) ([]productsdomain.ServiceCategory, error) {
	var serviceCategories []productsdomain.ServiceCategory

	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		var listErr error

		serviceCategories, listErr = s.ListServiceCategories(ctx, tx)
		if listErr != nil {
			return listErr
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return serviceCategories, nil
}
func (s *ProductsStore) CreateService(ctx context.Context, service *productsdomain.Service, bannerID uuid.UUID) error {

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		if err := tx.Create(service).Error; err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code == "23505" {
					return shared_errors.ErrConflict
				}
			}
			return err
		}

		if bannerID == uuid.Nil {
			return nil
		}

		bannerlink := &marketingdomain.BannerService{
			ServiceID: service.ServiceID,
			BannerID:  bannerID,
		}

		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(bannerlink).Error; err != nil {
			return err
		}

		return nil
	})

	return err
}

func (s *ProductsStore) CreateServiceTX(ctx context.Context, tx *gorm.DB, service *productsdomain.Service, bannerID uuid.UUID) error {

	if err := tx.Create(service).Error; err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return shared_errors.ErrConflict
			}
		}
		return err
	}

	if bannerID == uuid.Nil {
		return nil
	}

	bannerlink := &marketingdomain.BannerService{
		ServiceID: service.ServiceID,
		BannerID:  bannerID,
	}

	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(bannerlink).Error; err != nil {
		return err
	}

	return nil

}

func (s *ProductsStore) GetServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]productsdomain.Service, error) {
	var services []productsdomain.Service

	baseQuery := s.db.WithContext(ctx).Model(&productsdomain.Service{})

	if fq.Search != "" {
		baseQuery = baseQuery.Where("services.name ILIKE ?", "%"+fq.Search+"%")
	}

	if fq.Category != "" {
		baseQuery = baseQuery.Joins("JOIN service_categories ON service_categories.category_id = services.category_id").
			Where("service_categories.name ILIKE ?", "%"+fq.Category+"%")
	}

	query := baseQuery.
		Preload("Images").
		Preload("Category").
		Preload("Banners").
		Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("services.created_at " + fq.Sort)

	if err := query.Find(&services).Error; err != nil {
		return nil, err
	}

	return services, nil

}

func (s *ProductsStore) GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	var count int64
	baseQuery := s.db.WithContext(ctx).Model(&productsdomain.Service{})

	if fq.Search != "" {
		baseQuery = baseQuery.Where("services.name ILIKE ?", "%"+fq.Search+"%")
	}

	if fq.Category != "" {
		baseQuery = baseQuery.Joins("JOIN service_categories ON service_categories.category_id = services.category_id").
			Where("service_categories.name ILIKE ?", "%"+fq.Category+"%")
	}

	query := baseQuery.
		Preload("Images").
		Preload("Category").
		Preload("Banners").
		Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("services.created_at " + fq.Sort)

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (s *ProductsStore) GetServiceSummary(ctx context.Context) (*productsdomain.ServicesSummary, error) {
	var totalCount int64
	var activeCount int64
	var featuredCount int64
	var err error

	err = s.db.WithContext(ctx).
		Model(&productsdomain.Service{}).
		Count(&totalCount).Error

	if err != nil {
		return nil, err
	}

	err = s.db.WithContext(ctx).
		Model(&productsdomain.Service{}).
		Count(&activeCount).Error

	if err != nil {
		return nil, err
	}

	err = s.db.WithContext(ctx).
		Model(&productsdomain.Service{}).
		Where("is_featured = ?", true).
		Count(&featuredCount).Error

	if err != nil {
		return nil, err
	}

	summary := &productsdomain.ServicesSummary{
		Total:    totalCount,
		Actives:  activeCount,
		Featured: featuredCount,
	}

	return summary, nil
}

func (s *ProductsStore) DeleteService(ctx context.Context, serviceID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).Where("service_id = ?", serviceID).Delete(&scheduledomain.Class{}).Error; err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Where("service_id = ?", serviceID).Delete(&productsdomain.ServiceBranchDetail{}).Error; err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Delete(&productsdomain.Service{}, serviceID).Error; err != nil {
			return err
		}
		return nil
	})
}
func (s *ProductsStore) GetServiceByID(ctx context.Context, serviceID uuid.UUID) (*productsdomain.Service, error) {
	service := &productsdomain.Service{}
	err := s.db.Preload("Images").Preload("Category").Preload("Banners").First(service, serviceID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return service, nil

}

func (s *ProductsStore) GetServicesByIDs(ctx context.Context, serviceIDs []uuid.UUID) (map[uuid.UUID]*productsdomain.Service, error) {
	if len(serviceIDs) == 0 {
		return make(map[uuid.UUID]*productsdomain.Service), nil
	}

	var services []*productsdomain.Service
	if err := s.db.WithContext(ctx).Where("service_id IN ?", serviceIDs).Find(&services).Error; err != nil {
		return nil, err
	}

	servicesMap := make(map[uuid.UUID]*productsdomain.Service, len(services))
	for _, s := range services {
		servicesMap[s.ServiceID] = s
	}

	return servicesMap, nil
}

func (s *ProductsStore) UpdateService(ctx context.Context, service *productsdomain.Service, bannerID uuid.UUID) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("service_id = ?", service.ServiceID).Delete(&productsdomain.ServiceImage{}).Error; err != nil {
			return err
		}

		if err := tx.Where("service_id = ?", service.ServiceID).Delete(&marketingdomain.BannerService{}).Error; err != nil {
			return err
		}

		result := tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(service)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}
		if bannerID != uuid.Nil {
			bannerLink := &marketingdomain.BannerService{
				ServiceID: service.ServiceID,
				BannerID:  bannerID,
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(bannerLink).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *ProductsStore) GetPublicServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*productsdomain.ServiceWithPrice, int64, error) {
	var services []*productsdomain.ServiceWithPrice
	var count int64

	minMemberSQL := `
        COALESCE(
            (SELECT MIN(sbd.price_for_member)
             FROM service_branch_details sbd
             WHERE sbd.service_id = services.service_id
               AND sbd.deleted_at IS NULL
               AND sbd.is_visible = true
            ), 
        0)`

	minNonMemberSQL := `
        COALESCE(
            (SELECT MIN(sbd.price_for_non_member)
             FROM service_branch_details sbd
             WHERE sbd.service_id = services.service_id
               AND sbd.deleted_at IS NULL
               AND sbd.is_visible = true
            ), 
        0)`

	minAbsoluteSQL := `
        COALESCE(
            (SELECT MIN(LEAST(sbd.price_for_member, sbd.price_for_non_member))
             FROM service_branch_details sbd
             WHERE sbd.service_id = services.service_id
               AND sbd.deleted_at IS NULL
               AND sbd.is_visible = true
            ), 
        0)`

	tx := s.db.WithContext(ctx).
		Table("services").
		Select("services.*, (" + minMemberSQL + ") as lowest_price_member, (" + minNonMemberSQL + ") as lowest_price_non_member, 'USD' as base_currency").
		Where("services.deleted_at IS NULL")

	tx = tx.Where(`EXISTS (
        SELECT 1 FROM service_branch_details sbd 
        WHERE sbd.service_id = services.service_id 
          AND sbd.deleted_at IS NULL 
          AND sbd.is_visible = true
    )`)

	if fq.Search != "" {
		tx = tx.Where("services.name ILIKE ?", "%"+fq.Search+"%")
	}

	if fq.Category != "" {
		tx = tx.Where("services.category_id = ?", fq.Category)
	}

	if fq.Price > 0 {
		tx = tx.Where("("+minAbsoluteSQL+") <= ?", fq.Price)
	}

	if err := tx.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	sortDirection := fq.Sort
	if sortDirection == "" {
		sortDirection = "DESC"
	}

	switch fq.Sortby {
	case "price":
		tx = tx.Order("(" + minAbsoluteSQL + ") " + sortDirection)
	default:
		tx = tx.Order("services.is_featured DESC, services.priority_score DESC, services.created_at " + sortDirection)
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := tx.
		Preload("Category").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Limit(fq.Limit).
		Offset((page - 1) * fq.Limit).
		Find(&services).Error

	if err != nil {
		return nil, 0, err
	}

	return services, count, nil
}

func (s *ProductsStore) GetPublicBranchServices(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*productsdomain.ServiceWithPrice, int64, error) {
	var services []*productsdomain.ServiceWithPrice
	var count int64

	tx := s.db.WithContext(ctx).
		Table("services").
		Select("services.*, sbd.price_for_member as lowest_price_member, sbd.price_for_non_member as lowest_price_non_member").
		Joins("JOIN service_branch_details sbd ON sbd.service_id = services.service_id").
		Where("services.deleted_at IS NULL").
		Where("sbd.branch_id = ?", branchID).
		Where("sbd.deleted_at IS NULL").
		Where("sbd.is_visible = true")

	if fq.Search != "" {
		tx = tx.Where("services.name ILIKE ?", "%"+fq.Search+"%")
	}

	if fq.Category != "" {
		tx = tx.Where("services.category_id = ?", fq.Category)
	}

	if fq.Price > 0 {
		tx = tx.Where("LEAST(sbd.price_for_member, sbd.price_for_non_member) <= ?", fq.Price)
	}

	if err := tx.Model(&productsdomain.Service{}).Count(&count).Error; err != nil {
		return nil, 0, err
	}

	sortDirection := fq.Sort
	if sortDirection == "" {
		sortDirection = "DESC"
	}

	switch fq.Sortby {
	case "price":
		tx = tx.Order("LEAST(sbd.price_for_member, sbd.price_for_non_member) " + sortDirection)
	default:
		tx = tx.Order("services.is_featured DESC, services.priority_score DESC, services.created_at " + sortDirection)
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := tx.
		Preload("Category").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Limit(fq.Limit).
		Offset((page - 1) * fq.Limit).
		Find(&services).Error

	if err != nil {
		return nil, 0, err
	}

	return services, count, nil
}

func (s *ProductsStore) GetServiceCategoryByName(ctx context.Context, name string) (*productsdomain.ServiceCategory, error) {
	var serviceCategory productsdomain.ServiceCategory
	err := s.db.WithContext(ctx).
		Where("name = ?", name).
		First(&serviceCategory).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return &serviceCategory, nil

}

func (s *ProductsStore) GetAllServices(ctx context.Context) ([]productsdomain.Service, error) {
	var services []productsdomain.Service
	err := s.db.WithContext(ctx).
		Find(&services).Error
	if err != nil {
		return nil, err
	}
	return services, nil

}

func (s *ProductsStore) GetServiceImagesAndBanners(ctx context.Context, serviceID uuid.UUID) (*productsdomain.Service, error) {
	service := &productsdomain.Service{}
	err := s.db.WithContext(ctx).
		Preload("Images").
		Preload("Banners").
		Select("service_id").
		First(service, "service_id = ?", serviceID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return service, nil
}
