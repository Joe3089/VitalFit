package policiesdomain

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PoliciesRepository interface {
	CreatePolicyTx(ctx context.Context, tx *gorm.DB, policy *CommercialPolicy) error
	CreatePolicy(ctx context.Context, policy *CommercialPolicy) error
	GetPolicyByKey(ctx context.Context, key string) (*CommercialPolicy, error)
	UpdatePolicy(ctx context.Context, policy *CommercialPolicy) error
	GetPoliciesList(ctx context.Context, policy *CommercialPolicy) ([]CommercialPolicy, error)
	GetPolicyByID(ctx context.Context, policyID uuid.UUID) (*CommercialPolicy, error)
}
