package billingrepository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PaymentMethodsStore struct {
	db *gorm.DB
}

func NewPaymentMethodsStore(db *gorm.DB) *PaymentMethodsStore {
	return &PaymentMethodsStore{db: db}
}

func (s *PaymentMethodsStore) GetPaymentMethods(ctx context.Context) ([]*billingdomain.PaymentMethods, error) {
	var paymentMethods []*billingdomain.PaymentMethods
	err := s.db.WithContext(ctx).Find(&paymentMethods).Error
	if err != nil {
		return nil, err
	}
	return paymentMethods, nil
}

func (s *PaymentMethodsStore) GetPaymentMethodByID(ctx context.Context, methodID uuid.UUID) (*billingdomain.PaymentMethods, error) {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	var paymentMethod billingdomain.PaymentMethods
	err := s.db.WithContext(ctx).Where("method_id = ?", methodID).First(&paymentMethod).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &paymentMethod, nil
}

func (s *PaymentMethodsStore) CreatePaymentMethod(ctx context.Context, paymentMethod *billingdomain.PaymentMethods) error {
	err := s.db.WithContext(ctx).Create(&paymentMethod).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return shared_errors.ErrConflict
		}
		return err
	}
	return nil
}

func (s *PaymentMethodsStore) UpdatePaymentMethod(ctx context.Context, paymentMethod *billingdomain.PaymentMethods) error {
	err := s.db.WithContext(ctx).Model(&billingdomain.PaymentMethods{}).Where("method_id = ?", paymentMethod.MethodID).Updates(paymentMethod).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *PaymentMethodsStore) DeletePaymentMethod(ctx context.Context, methodID uuid.UUID) error {
	err := s.db.WithContext(ctx).Delete(&billingdomain.PaymentMethods{}, methodID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *PaymentMethodsStore) AddPaymentMethodsToBranch(ctx context.Context, branchMethod []*billingdomain.PaymentMethodsBranch) error {
	if len(branchMethod) == 0 {
		return nil
	}

	return db.WithTX(s.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "branch_id"}, {Name: "method_id"}},
			DoNothing: true,
		}).Create(&branchMethod).Error
	})
}

func (s *PaymentMethodsStore) DeletePaymentMethodsFromBranch(ctx context.Context, branchID, methodID uuid.UUID) error {
	err := s.db.WithContext(ctx).Where("branch_id = ? AND method_id = ?", branchID, methodID).Delete(&billingdomain.PaymentMethodsBranch{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (s *PaymentMethodsStore) GetPaymentMethodsFromBranch(ctx context.Context, branchID uuid.UUID) ([]*billingdomain.PaymentMethodsBranch, error) {
	var Branchmethods []*billingdomain.PaymentMethodsBranch
	err := s.db.WithContext(ctx).Preload("Method").Where("branch_id = ?", branchID).Find(&Branchmethods).Error
	if err != nil {
		return nil, err
	}
	return Branchmethods, nil
}

func (s *PaymentMethodsStore) UpsertBranchPaymentConfig(ctx context.Context, branchMethod *billingdomain.PaymentMethodsBranch) error {
	branchMethod.UpdatedAt = time.Now()

	result := s.db.WithContext(ctx).Clauses(clause.OnConflict{

		Columns: []clause.Column{{Name: "branch_id"}, {Name: "method_id"}},

		DoUpdates: clause.AssignmentColumns([]string{
			"is_active",
			"updated_at",
		}),
	}).Create(branchMethod)

	return result.Error
}

func (s *PaymentMethodsStore) GetBranchPaymentMethodByID(ctx context.Context, branchID uuid.UUID, methodID uuid.UUID) (*billingdomain.PaymentMethodsBranch, error) {
	var branchMethod billingdomain.PaymentMethodsBranch
	err := s.db.WithContext(ctx).Preload("Method").Model(&billingdomain.PaymentMethodsBranch{}).Where("branch_id = ? AND method_id = ?", branchID, methodID).First(&branchMethod).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return &branchMethod, nil

}

func (s *PaymentMethodsStore) GetPaymentMethodsByType(ctx context.Context, methodType billingdomain.PaymentMethodTypeEnum) ([]*billingdomain.PaymentMethods, error) {
	var paymentMethods []*billingdomain.PaymentMethods
	err := s.db.WithContext(ctx).Where("type = ? AND processing_type = ?", methodType, billingdomain.PaymentProcessingGateway).Find(&paymentMethods).Error
	if err != nil {
		return nil, err
	}
	return paymentMethods, nil
}
