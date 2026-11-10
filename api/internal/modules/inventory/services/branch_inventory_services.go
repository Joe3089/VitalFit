package inventoryservices

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
	"github.com/vitalfit/api/internal/store"
)

type BranchInventoryServices struct {
	store  store.Storage
	config config.Config
}

func NewBranchInventoryServices(store store.Storage, cfg config.Config) *BranchInventoryServices {
	return &BranchInventoryServices{
		store:  store,
		config: cfg,
	}
}

func (s *BranchInventoryServices) AddInventoryItem(ctx context.Context, item *inventorydomain.BranchInventory) error {
	_, err := s.store.BranchInventory.Create(ctx, item)
	if err != nil {
		return err
	}
	return nil
}

func (s *BranchInventoryServices) ListBranchInventory(ctx context.Context, branchID uuid.UUID) ([]inventorydomain.BranchInventory, error) {
	inventory, err := s.store.BranchInventory.GetByBranch(ctx, branchID)
	if err != nil {
		return nil, err
	}
	return inventory, nil
}

func (s *BranchInventoryServices) GetInventoryItemByID(ctx context.Context, inventoryID uuid.UUID) (*inventorydomain.BranchInventory, error) {
	item, err := s.store.BranchInventory.GetByID(ctx, inventoryID)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (s *BranchInventoryServices) UpdateInventoryItem(ctx context.Context, item *inventorydomain.BranchInventory) error {
	err := s.store.BranchInventory.Update(ctx, item)
	if err != nil {
		return err
	}
	return nil
}

func (s *BranchInventoryServices) DeleteInventoryItem(ctx context.Context, inventoryID uuid.UUID, branchID uuid.UUID) error {
	err := s.store.BranchInventory.Delete(ctx, inventoryID, branchID)
	if err != nil {
		return err
	}
	return nil
}
