package productsservice

import (
	"context"

	"github.com/google/uuid"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type ProductsService struct {
	store store.Storage
}

func NewProductsService(store store.Storage) *ProductsService {
	return &ProductsService{
		store: store,
	}
}

func (s *ProductsService) ListServiceCategories(ctx context.Context) ([]productsdomain.ServiceCategory, error) {
	return s.store.Products.GetServicesCategories(ctx)
}

func (s *ProductsService) CreateService(ctx context.Context, service *productsdomain.Service, bannerID uuid.UUID) error {
	return s.store.Products.CreateService(ctx, service, bannerID)
}

func (s *ProductsService) GetServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]productsdomain.Service, error) {
	return s.store.Products.GetServices(ctx, fq)
}
func (s *ProductsService) GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	return s.store.Products.GetTotalCount(ctx, fq)
}

func (s *ProductsService) GetServiceSummary(ctx context.Context) (*productsdomain.ServicesSummary, error) {
	return s.store.Products.GetServiceSummary(ctx)
}

func (s *ProductsService) DeleteService(ctx context.Context, serviceID uuid.UUID) error {
	return s.store.Products.DeleteService(ctx, serviceID)
}

func (s *ProductsService) GetServiceByID(ctx context.Context, serviceID uuid.UUID) (*productsdomain.Service, error) {
	return s.store.Products.GetServiceByID(ctx, serviceID)
}

func (s *ProductsService) UpdateService(ctx context.Context, service *productsdomain.Service, bannerID uuid.UUID) error {
	return s.store.Products.UpdateService(ctx, service, bannerID)
}

func (s *ProductsService) GetPublicServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*productsdomain.ServiceWithPrice, int64, error) {
	services, total, err := s.store.Products.GetPublicServices(ctx, fq)
	if err != nil {
		return nil, 0, err
	}

	for i := range services {
		details, err := s.store.Products.GetServiceImagesAndBanners(ctx, services[i].ServiceID)
		if err == nil {
			services[i].Images = details.Images
			services[i].Banners = details.Banners
		}
	}
	return services, total, nil
}

func (s *ProductsService) GetPublicBranchServices(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*productsdomain.ServiceWithPrice, int64, error) {
	services, total, err := s.store.Products.GetPublicBranchServices(ctx, branchID, fq)
	if err != nil {
		return nil, 0, err
	}

	for i := range services {
		details, err := s.store.Products.GetServiceImagesAndBanners(ctx, services[i].ServiceID)
		if err == nil {
			services[i].Images = details.Images
			services[i].Banners = details.Banners
		}
	}
	return services, total, nil
}

func (s *ProductsService) GetServiceImagesAndBanners(ctx context.Context, serviceID uuid.UUID) (*productsdomain.Service, error) {
	return s.store.Products.GetServiceImagesAndBanners(ctx, serviceID)
}

func (s *ProductsService) GetClientBalances(ctx context.Context, userID uuid.UUID) ([]productsdomain.ClientServiceBalance, error) {
	return s.store.Products.GetClientBalances(ctx, userID)
}
