package billingservice

import (
	"context"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
)

// ApplyPostSaleDiscount applies a traceable discount to an open invoice. The
// accumulated discount is capped by the GLOBAL_MAX_DISCOUNT commercial policy.
// If the discounted total is already covered by completed payments the invoice
// is closed and its items activated, as it would be after a payment.
func (s *BillingService) ApplyPostSaleDiscount(ctx context.Context, adj *billingdomain.InvoiceAdjustment) (*billingdomain.InvoiceAdjustment, error) {
	maxPct := decimal.NewFromInt(100)
	if policy, err := s.store.Policies.GetPolicyByKey(ctx, "GLOBAL_MAX_DISCOUNT"); err == nil && policy.IsActive {
		if v, err := policy.GetFloat(); err == nil {
			maxPct = decimal.NewFromFloat(v)
		}
	}

	if err := s.store.InvoiceAdjustments.ApplyAdjustment(ctx, adj, maxPct); err != nil {
		return nil, err
	}

	invoice, err := s.store.Billing.GetInvoiceByID(ctx, adj.InvoiceID)
	if err != nil {
		return adj, nil
	}
	if invoice.Status != billingdomain.InvoiceStatusPaid && invoice.GetRemainingDebt().LessThanOrEqual(decimal.Zero) {
		invoice.Status = billingdomain.InvoiceStatusPaid
		if err := s.UpdateInvoiceStatus(ctx, invoice); err != nil {
			return nil, err
		}
		_ = s.ActivateInvoiceItems(ctx, invoice)
		s.sendPaidInvoiceEmail(invoice)
	}
	return adj, nil
}

func (s *BillingService) ListInvoiceAdjustments(ctx context.Context, invoiceID uuid.UUID) ([]billingdomain.InvoiceAdjustment, error) {
	return s.store.InvoiceAdjustments.ListAdjustments(ctx, invoiceID)
}
