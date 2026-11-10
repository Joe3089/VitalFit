package productsdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type ProductsServiceInterface interface {
	ListServiceCategories(ctx context.Context) ([]ServiceCategory, error)
	CreateService(ctx context.Context, service *Service, bannerID uuid.UUID) error
	GetServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]Service, error)
	GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	GetServiceSummary(ctx context.Context) (*ServicesSummary, error)
	DeleteService(ctx context.Context, serviceID uuid.UUID) error
	GetServiceByID(ctx context.Context, serviceID uuid.UUID) (*Service, error)
	UpdateService(ctx context.Context, service *Service, bannerID uuid.UUID) error
	GetServiceImagesAndBanners(ctx context.Context, serviceID uuid.UUID) (*Service, error)

	//branch-service
	AssignBranchService(ctx context.Context, branchServices []*ServiceBranchDetail) error
	GetBranchService(ctx context.Context, branchID uuid.UUID) ([]*ServiceBranchDetail, error)
	UpdateBranchService(ctx context.Context, branchService *ServiceBranchDetail) error
	DeleteBranchService(ctx context.Context, branchID uuid.UUID, serviceID uuid.UUID) error
	GetBranchServiceByID(ctx context.Context, branchID uuid.UUID, serviceID uuid.UUID) (*ServiceBranchDetail, error)

	//public
	GetPublicServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*ServiceWithPrice, int64, error)
	GetPublicBranchServices(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*ServiceWithPrice, int64, error)
	GetClientBalances(ctx context.Context, userID uuid.UUID) ([]ClientServiceBalance, error)
}
