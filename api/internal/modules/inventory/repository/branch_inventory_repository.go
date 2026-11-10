package inventoryrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BranchInventoryStore struct {
	db *gorm.DB
}

func NewBranchInventoryStore(db *gorm.DB) *BranchInventoryStore {
	return &BranchInventoryStore{db: db}
}

func (s *BranchInventoryStore) Create(ctx context.Context, item *inventorydomain.BranchInventory) (*inventorydomain.BranchInventory, error) {
	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).Create(&item).Error; err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				if pgErr.ConstraintName == "branch_inventory_serial_number_key" {
					return shared_errors.ErrConflict
				}
			}
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (s *BranchInventoryStore) GetByBranch(ctx context.Context, branchID uuid.UUID) ([]inventorydomain.BranchInventory, error) {
	var inventory []inventorydomain.BranchInventory
	err := s.db.WithContext(ctx).
		Where("branch_id = ?", branchID).
		Preload("Equipment", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Order("created_at desc").
		Find(&inventory).Error
	if err != nil {
		return nil, err
	}
	return inventory, nil
}

func (s *BranchInventoryStore) GetByID(ctx context.Context, inventoryID uuid.UUID) (*inventorydomain.BranchInventory, error) {
	var item inventorydomain.BranchInventory
	err := s.db.WithContext(ctx).
		Preload("Equipment").
		First(&item, "inventory_id = ?", inventoryID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (s *BranchInventoryStore) Update(ctx context.Context, item *inventorydomain.BranchInventory) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	return db.WithTX(s.db, func(tx *gorm.DB) error {
		result := tx.WithContext(ctx).
			Model(item).Where("branch_id = ?", item.BranchID).
			Clauses(clause.Returning{}).
			Updates(map[string]interface{}{
				"status":                item.Status,
				"last_maintenance_date": item.LastMaintenanceDate,
				"notes":                 item.Notes,
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}
		return nil
	})
}

func (s *BranchInventoryStore) Delete(ctx context.Context, inventoryID uuid.UUID, branchID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	return db.WithTX(s.db, func(tx *gorm.DB) error {
		result := tx.WithContext(ctx).
			Delete(&inventorydomain.BranchInventory{}, "inventory_id = ? AND branch_id = ?", inventoryID, branchID)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}
		return nil
	})
}
