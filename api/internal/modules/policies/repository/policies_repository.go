package policiesrepository

import (
	"context"

	"github.com/google/uuid"
	policiesdomain "github.com/vitalfit/api/internal/modules/policies/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"gorm.io/gorm"
)

type PoliciesStore struct {
	db *gorm.DB
}

func NewPoliciesStore(db *gorm.DB) *PoliciesStore {
	return &PoliciesStore{
		db: db,
	}

}

func (s *PoliciesStore) CreatePolicyTx(ctx context.Context, tx *gorm.DB, policy *policiesdomain.CommercialPolicy) error {
	return tx.WithContext(ctx).Create(policy).Error
}

func (s *PoliciesStore) CreatePolicy(ctx context.Context, policy *policiesdomain.CommercialPolicy) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).Create(policy).Error
	})
}

func (s *PoliciesStore) GetPolicyByKey(ctx context.Context, key string) (*policiesdomain.CommercialPolicy, error) {
	var policy policiesdomain.CommercialPolicy
	if err := s.db.WithContext(ctx).Where("policy_key = ?", key).First(&policy).Error; err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return &policy, nil
}

func (s *PoliciesStore) UpdatePolicy(ctx context.Context, policy *policiesdomain.CommercialPolicy) error {
	if policy.DataType != "" {
		if _, err := policy.ParseValue(); err != nil {
			return err
		}
	}
	return s.db.WithContext(ctx).Model(policy).Select("Value").Updates(policy).Error
}

func (s *PoliciesStore) GetPoliciesList(ctx context.Context, policy *policiesdomain.CommercialPolicy) ([]policiesdomain.CommercialPolicy, error) {
	var policies []policiesdomain.CommercialPolicy
	query := s.db.WithContext(ctx)

	if policy != nil {
		query = query.Where(policy)
	}

	if err := query.Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

func (s *PoliciesStore) GetPolicyByID(ctx context.Context, policyID uuid.UUID) (*policiesdomain.CommercialPolicy, error) {
	var policy policiesdomain.CommercialPolicy
	if err := s.db.WithContext(ctx).Where("id = ?", policyID).First(&policy).Error; err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return &policy, nil

}
