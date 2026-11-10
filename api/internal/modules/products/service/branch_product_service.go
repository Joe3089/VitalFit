package productsservice

import (
	"context"

	"github.com/google/uuid"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
)

func (s *ProductsService) AssignBranchService(ctx context.Context, branchServices []*productsdomain.ServiceBranchDetail) error {
	err := s.store.Products.AssignBranchService(ctx, branchServices)
	if err != nil {
		return err
	}
	return nil
}
func (s *ProductsService) GetBranchService(ctx context.Context, branchID uuid.UUID) ([]*productsdomain.ServiceBranchDetail, error) {
	branchServices, err := s.store.Products.GetBranchService(ctx, branchID)
	if err != nil {
		return nil, err
	}
	return branchServices, nil
}
func (s *ProductsService) UpdateBranchService(ctx context.Context, branchService *productsdomain.ServiceBranchDetail) error {
	err := s.store.Products.UpdateBranchService(ctx, branchService)
	if err != nil {
		return err
	}
	return nil
}
func (s *ProductsService) DeleteBranchService(ctx context.Context, branchID uuid.UUID, serviceID uuid.UUID) error {
	err := s.store.Products.DeleteBranchService(ctx, branchID, serviceID)
	if err != nil {
		return err
	}
	return nil
}
func (s *ProductsService) GetBranchServiceByID(ctx context.Context, branchID uuid.UUID, serviceID uuid.UUID) (*productsdomain.ServiceBranchDetail, error) {
	branchService, err := s.store.Products.GetBranchServiceByID(ctx, branchID, serviceID)
	if err != nil {
		return nil, err
	}
	return branchService, nil
}
