package combosservices

import (
	"context"

	"github.com/google/uuid"
	combosdomain "github.com/vitalfit/api/internal/modules/combos/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type CombosServices struct {
	store store.Storage
}

func NewCombosServices(store store.Storage) *CombosServices {
	return &CombosServices{store: store}
}

func (s *CombosServices) CreatePackage(ctx context.Context, pkg *combosdomain.Package) error {
	return s.store.Combos.CreatePackage(ctx, pkg)
}

func (s *CombosServices) GetPackages(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*combosdomain.Package, error) {
	return s.store.Combos.GetPackages(ctx, fq)
}

func (s *CombosServices) GetPackagesTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	return s.store.Combos.GetPackagesTotal(ctx, fq)
}

func (s *CombosServices) GetPackageByID(ctx context.Context, packageID uuid.UUID) (*combosdomain.Package, error) {
	return s.store.Combos.GetPackageByID(ctx, packageID)
}

func (s *CombosServices) UpdatePackage(ctx context.Context, pkg *combosdomain.Package) error {
	return s.store.Combos.UpdatePackage(ctx, pkg)
}

func (s *CombosServices) DeletePackage(ctx context.Context, packageID uuid.UUID) error {
	return s.store.Combos.DeletePackage(ctx, packageID)
}

func (s *CombosServices) GetPublicPackages(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*combosdomain.Package, int64, error) {
	return s.store.Combos.GetPublicPackages(ctx, fq)
}
