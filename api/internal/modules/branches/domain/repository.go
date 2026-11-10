package branchdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type BranchesRepository interface {
	GetByID(ctx context.Context, branchID uuid.UUID) (*Branch, error)
	Update(ctx context.Context, branch *Branch) error
	Create(ctx context.Context, tx *gorm.DB, branch *Branch) error
	CreateBranch(ctx context.Context, branch *Branch) error
	GetBranches(ctx context.Context, fq pagination.PaginatedFeedQuery) (*BranchQueryResults, error)
	Delete(ctx context.Context, branchID uuid.UUID) error
	GetBranchStatusCount(ctx context.Context) (*BranchStatusCount, error)
	GetPublicBranchesMap(ctx context.Context) ([]PublicBranchMapResponse, error)
	GetAllBranches(ctx context.Context) ([]*Branch, error)
}

type LocationRepository interface {
	FindOrCreateStateByCountry(ctx context.Context, stateName string, countryName string) (*States, error)
}
