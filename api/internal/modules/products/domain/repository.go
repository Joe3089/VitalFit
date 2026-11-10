package productsdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type ProductsRepository interface {
	CreateServiceCategory(ctx context.Context, tx *gorm.DB, serviceCategory *ServiceCategory) error
	ListServiceCategories(ctx context.Context, tx *gorm.DB) ([]ServiceCategory, error)
	GetServicesCategories(ctx context.Context) ([]ServiceCategory, error)
	GetServiceCategoryByName(ctx context.Context, name string) (*ServiceCategory, error)

	CreateService(ctx context.Context, service *Service, bannerID uuid.UUID) error
	CreateServiceTX(ctx context.Context, tx *gorm.DB, service *Service, bannerID uuid.UUID) error
	GetServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]Service, error)
	GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	GetServiceSummary(ctx context.Context) (*ServicesSummary, error)
	DeleteService(ctx context.Context, serviceID uuid.UUID) error
	GetServicesByIDs(ctx context.Context, serviceIDs []uuid.UUID) (map[uuid.UUID]*Service, error)
	GetServiceByID(ctx context.Context, serviceID uuid.UUID) (*Service, error)
	UpdateService(ctx context.Context, service *Service, bannerID uuid.UUID) error
	GetAllServices(ctx context.Context) ([]Service, error)
	GetServiceImagesAndBanners(ctx context.Context, serviceID uuid.UUID) (*Service, error)

	AssignBranchService(ctx context.Context, branchServices []*ServiceBranchDetail) error
	GetBranchService(ctx context.Context, branchID uuid.UUID) ([]*ServiceBranchDetail, error)
	UpdateBranchService(ctx context.Context, branchService *ServiceBranchDetail) error
	DeleteBranchService(ctx context.Context, branchID uuid.UUID, serviceID uuid.UUID) error
	GetBranchServicesByIDs(ctx context.Context, branchID uuid.UUID, serviceIDs []uuid.UUID) (map[uuid.UUID]*ServiceBranchDetail, error)
	GetBranchServiceByID(ctx context.Context, branchID uuid.UUID, serviceID uuid.UUID) (*ServiceBranchDetail, error)
	GetBranchServiceByName(ctx context.Context, branchID uuid.UUID, serviceName string) (*ServiceBranchDetail, error)

	GetPublicServices(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*ServiceWithPrice, int64, error)
	GetPublicBranchServices(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*ServiceWithPrice, int64, error)

	ClientServiceBalance(ctx context.Context, clientBalance *ClientServiceBalance) error
	GetClientBalance(ctx context.Context, userID uuid.UUID, serviceID uuid.UUID) (*ClientServiceBalance, error)
	GetClientBalances(ctx context.Context, userID uuid.UUID) ([]ClientServiceBalance, error)
	SpendClientBalance(ctx context.Context, userID, serviceID uuid.UUID) error
	RefundClientBalanceTx(ctx context.Context, tx *gorm.DB, userID uuid.UUID, serviceID uuid.UUID) error
}
