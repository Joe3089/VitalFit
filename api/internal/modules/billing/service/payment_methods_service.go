package billingservice

import (
	"context"

	"github.com/google/uuid"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
)

func (s *BillingService) GetPaymentMethodByID(ctx context.Context, methodID uuid.UUID) (*billingdomain.PaymentMethods, error) {
	paymentMethod, err := s.store.PaymentMethods.GetPaymentMethodByID(ctx, methodID)
	if err != nil {
		return nil, err
	}
	return paymentMethod, nil
}

func (s *BillingService) GetPaymentMethods(ctx context.Context) ([]*billingdomain.PaymentMethods, error) {
	paymentMethods, err := s.store.PaymentMethods.GetPaymentMethods(ctx)
	if err != nil {
		return nil, err
	}
	return paymentMethods, nil
}

func (s *BillingService) GetPaymentMethodsByType(ctx context.Context, methodType billingdomain.PaymentMethodTypeEnum) ([]*billingdomain.PaymentMethods, error) {
	paymentMethods, err := s.store.PaymentMethods.GetPaymentMethodsByType(ctx, methodType)
	if err != nil {
		return nil, err
	}
	return paymentMethods, nil
}

func (s *BillingService) CreatePaymentMethod(ctx context.Context, paymentMethod *billingdomain.PaymentMethods) error {
	err := s.store.PaymentMethods.CreatePaymentMethod(ctx, paymentMethod)
	if err != nil {
		return err
	}
	return nil

}

func (s *BillingService) UpdatePaymentMethod(ctx context.Context, paymentMethod *billingdomain.PaymentMethods) error {
	err := s.store.PaymentMethods.UpdatePaymentMethod(ctx, paymentMethod)
	if err != nil {
		return err
	}
	return nil
}

func (s *BillingService) DeletePaymentMethod(ctx context.Context, methodID uuid.UUID) error {
	err := s.store.PaymentMethods.DeletePaymentMethod(ctx, methodID)
	if err != nil {
		return err
	}
	return nil
}

func (s *BillingService) AddPaymentMethodsToBranch(ctx context.Context, branchMethod []*billingdomain.PaymentMethodsBranch) error {
	err := s.store.PaymentMethods.AddPaymentMethodsToBranch(ctx, branchMethod)
	if err != nil {
		return err
	}
	return nil
}
func (s *BillingService) DeletePaymentMethodsFromBranch(ctx context.Context, branchID, methodID uuid.UUID) error {
	err := s.store.PaymentMethods.DeletePaymentMethodsFromBranch(ctx, branchID, methodID)
	if err != nil {
		return err
	}
	return nil
}
func (s *BillingService) GetPaymentMethodsFromBranch(ctx context.Context, branchID uuid.UUID) ([]*billingdomain.PaymentMethodsBranch, error) {
	Branchmethods, err := s.store.PaymentMethods.GetPaymentMethodsFromBranch(ctx, branchID)
	if err != nil {
		return nil, err
	}
	return Branchmethods, nil
}
func (s *BillingService) UpsertBranchPaymentConfig(ctx context.Context, branchMethod *billingdomain.PaymentMethodsBranch) error {
	err := s.store.PaymentMethods.UpsertBranchPaymentConfig(ctx, branchMethod)
	if err != nil {
		return err
	}
	return nil
}

func (s *BillingService) GetBranchPaymentMethodByID(ctx context.Context, branchID uuid.UUID, methodID uuid.UUID) (*billingdomain.PaymentMethodsBranch, error) {
	branchMethod, err := s.store.PaymentMethods.GetBranchPaymentMethodByID(ctx, branchID, methodID)
	if err != nil {
		return nil, err
	}
	return branchMethod, nil
}
