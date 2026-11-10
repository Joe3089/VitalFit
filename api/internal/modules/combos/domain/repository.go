package combosdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type CombosRepository interface {
	CreatePackage(ctx context.Context, pkg *Package) error
	GetPackages(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Package, error)
	GetPackagesTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	GetPackageByID(ctx context.Context, packageID uuid.UUID) (*Package, error)
	UpdatePackage(ctx context.Context, pkg *Package) error
	DeletePackage(ctx context.Context, packageID uuid.UUID) error
	GetPackagesByIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]*Package, error)
	GetAllPackages(ctx context.Context) ([]*Package, error)

	GetPublicPackages(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Package, int64, error)
}
