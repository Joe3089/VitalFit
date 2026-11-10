package inventorydomain

import (
	"context"

	"github.com/google/uuid"
)

type BranchInventoryRepository interface {
	Create(ctx context.Context, item *BranchInventory) (*BranchInventory, error)
	GetByBranch(ctx context.Context, branchID uuid.UUID) ([]BranchInventory, error)
	Update(ctx context.Context, item *BranchInventory) error
	Delete(ctx context.Context, inventoryID uuid.UUID, branchID uuid.UUID) error
	GetByID(ctx context.Context, inventoryID uuid.UUID) (*BranchInventory, error)
}
