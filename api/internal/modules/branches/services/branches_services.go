package branchservices

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type BranchServices struct {
	store  store.Storage
	config config.Config
}

func NewBranchServices(store store.Storage, cfg config.Config) *BranchServices {
	return &BranchServices{
		store:  store,
		config: cfg,
	}
}

func (s *BranchServices) CreateBranch(ctx context.Context, branch *branchdomain.Branch) error {
	err := s.store.Branches.CreateBranch(ctx, branch)
	if err != nil {
		return err
	}
	return nil
}

func (s *BranchServices) GetBranches(ctx context.Context, fq pagination.PaginatedFeedQuery) (*branchdomain.BranchQueryResults, error) {
	branches, err := s.store.Branches.GetBranches(ctx, fq)
	if err != nil {
		return nil, err
	}
	return branches, nil
}

func (s *BranchServices) DeleteBranch(ctx context.Context, branchID uuid.UUID) error {
	err := s.store.Branches.Delete(ctx, branchID)
	if err != nil {
		return err
	}
	return nil
}

func (s *BranchServices) GetBranchByID(ctx context.Context, branchID uuid.UUID) (*branchdomain.Branch, error) {
	branch, err := s.store.Branches.GetByID(ctx, branchID)
	if err != nil {
		return nil, err
	}
	return branch, nil
}

func (s *BranchServices) UpdateBranch(ctx context.Context, branch *branchdomain.Branch) error {
	err := s.store.Branches.Update(ctx, branch)
	if err != nil {
		return err
	}
	return nil
}

func (s *BranchServices) GetBranchStatusCount(ctx context.Context) (*branchdomain.BranchStatusCount, error) {
	counts, err := s.store.Branches.GetBranchStatusCount(ctx)
	if err != nil {
		return nil, err
	}
	counts.Total = counts.Active + counts.Inactive + counts.Maintenance
	return counts, nil
}

func (s *BranchServices) GetPublicBranchesMap(ctx context.Context) ([]branchdomain.PublicBranchMapResponse, error) {
	branches, err := s.store.Branches.GetPublicBranchesMap(ctx)
	if err != nil {
		return nil, err
	}
	return branches, nil
}
