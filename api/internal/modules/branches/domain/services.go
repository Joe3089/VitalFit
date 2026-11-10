package branchdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type BranchesServicesInterface interface {
	CreateBranch(ctx context.Context, branch *Branch) error
	GetBranches(ctx context.Context, fq pagination.PaginatedFeedQuery) (*BranchQueryResults, error)
	DeleteBranch(ctx context.Context, branchID uuid.UUID) error
	GetBranchByID(ctx context.Context, branchID uuid.UUID) (*Branch, error)
	UpdateBranch(ctx context.Context, branch *Branch) error
	GetBranchStatusCount(ctx context.Context) (*BranchStatusCount, error)
	GetPublicBranchesMap(ctx context.Context) ([]PublicBranchMapResponse, error)
}

type LocationsServicesInterface interface {
	FindOrCreateStateByCountry(ctx context.Context, stateName string, countryName string) (*States, error)
}
