package inventorydomain

import (
	"context"

	"github.com/google/uuid"
)

type BranchInventoryServicesInterface interface {
	AddInventoryItem(ctx context.Context, item *BranchInventory) error
	ListBranchInventory(ctx context.Context, branchID uuid.UUID) ([]BranchInventory, error)
	UpdateInventoryItem(ctx context.Context, item *BranchInventory) error
	DeleteInventoryItem(ctx context.Context, inventoryID uuid.UUID, branchID uuid.UUID) error
	GetInventoryItemByID(ctx context.Context, inventoryID uuid.UUID) (*BranchInventory, error)
}
