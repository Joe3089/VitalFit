package policiesservices

import (
	"context"

	"github.com/google/uuid"
	policiesdomain "github.com/vitalfit/api/internal/modules/policies/domain"
	"github.com/vitalfit/api/internal/store"
)

type PoliciesServices struct {
	store store.Storage
}

func NewPoliciesServices(store store.Storage) *PoliciesServices {
	return &PoliciesServices{
		store: store,
	}
}

func (s *PoliciesServices) CreatePolicy(ctx context.Context, policy *policiesdomain.CommercialPolicy) error {
	return s.store.Policies.CreatePolicy(ctx, policy)
}

func (s *PoliciesServices) GetPolicyByKey(ctx context.Context, key string) (*policiesdomain.CommercialPolicy, error) {
	return s.store.Policies.GetPolicyByKey(ctx, key)
}
func (s *PoliciesServices) UpdatePolicy(ctx context.Context, policy *policiesdomain.CommercialPolicy) error {
	return s.store.Policies.UpdatePolicy(ctx, policy)
}
func (s *PoliciesServices) GetPoliciesList(ctx context.Context, policy *policiesdomain.CommercialPolicy) ([]policiesdomain.CommercialPolicy, error) {
	return s.store.Policies.GetPoliciesList(ctx, policy)
}
func (s *PoliciesServices) GetPolicyByID(ctx context.Context, policyID uuid.UUID) (*policiesdomain.CommercialPolicy, error) {
	return s.store.Policies.GetPolicyByID(ctx, policyID)
}
