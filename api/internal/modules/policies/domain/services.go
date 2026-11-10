package policiesdomain

import (
	"context"

	"github.com/google/uuid"
)

type PoliciesServicesInterface interface {
	GetPolicyByKey(ctx context.Context, key string) (*CommercialPolicy, error)
	UpdatePolicy(ctx context.Context, policy *CommercialPolicy) error
	GetPoliciesList(ctx context.Context, policy *CommercialPolicy) ([]CommercialPolicy, error)
	GetPolicyByID(ctx context.Context, policyID uuid.UUID) (*CommercialPolicy, error)
}
