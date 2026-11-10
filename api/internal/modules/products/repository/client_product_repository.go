package productsrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

func (s *ProductsStore) ClientServiceBalance(ctx context.Context, clientBalance *productsdomain.ClientServiceBalance) error {
	return s.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "service_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"balance": gorm.Expr("client_service_balances.balance + ?", clientBalance.Balance)}),
		}).
		Create(clientBalance).Error
}

func (s *ProductsStore) GetClientBalance(ctx context.Context, userID uuid.UUID, serviceID uuid.UUID) (*productsdomain.ClientServiceBalance, error) {
	var clientBalance productsdomain.ClientServiceBalance
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND service_id = ?", userID, serviceID).
		First(&clientBalance).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &clientBalance, nil
}

func (s *ProductsStore) GetClientBalances(ctx context.Context, userID uuid.UUID) ([]productsdomain.ClientServiceBalance, error) {
	var clientBalances []productsdomain.ClientServiceBalance
	err := s.db.WithContext(ctx).
		Preload("Service").
		Where("user_id = ?", userID).
		Find(&clientBalances).Error

	return clientBalances, err
}

func (s *ProductsStore) SpendClientBalance(ctx context.Context, userID uuid.UUID, serviceID uuid.UUID) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&productsdomain.ClientServiceBalance{}).
			Where("user_id = ? AND service_id = ? AND balance > 0", userID, serviceID).
			Update("balance", gorm.Expr("balance - 1"))

		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrInsufficientBalance
		}
		return nil
	})
}

func (s *ProductsStore) RefundClientBalanceTx(ctx context.Context, tx *gorm.DB, userID, serviceID uuid.UUID) error {
	// Solo incrementa el balance si el registro existe. No crea uno nuevo.
	result := tx.WithContext(ctx).Model(&productsdomain.ClientServiceBalance{}).
		Where("user_id = ? AND service_id = ?", userID, serviceID).
		Update("balance", gorm.Expr("balance + 1"))

	return result.Error
}
