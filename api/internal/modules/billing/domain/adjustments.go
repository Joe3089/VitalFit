package billingdomain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// InvoiceAdjustment records a post-sale discount applied to an invoice (HU-MEM-04).
type InvoiceAdjustment struct {
	AdjustmentID  uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"adjustment_id"`
	InvoiceID     uuid.UUID       `gorm:"type:uuid;not null" json:"invoice_id"`
	DiscountType  string          `gorm:"type:varchar(20);not null" json:"discount_type"`
	DiscountValue decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"discount_value"`
	Amount        decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount"`
	PreviousTotal decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"previous_total"`
	NewTotal      decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"new_total"`
	Reason        string          `gorm:"type:text;not null" json:"reason"`
	AppliedBy     *uuid.UUID      `gorm:"type:uuid" json:"applied_by"`
	AppliedByName string          `gorm:"->;-:migration" json:"applied_by_name"`
	CreatedAt     time.Time       `json:"created_at"`
}

func (InvoiceAdjustment) TableName() string { return "invoice_adjustments" }

var (
	ErrAdjustmentInvalidInvoice = errors.New("discounts can only be applied to unpaid or overdue invoices")
	ErrAdjustmentExceedsPolicy  = errors.New("the accumulated discount exceeds the maximum allowed by the commercial policy")
	ErrAdjustmentBelowPaid      = errors.New("the discount would leave the invoice total below the amount already paid")
)

type InvoiceAdjustmentRepository interface {
	// ApplyAdjustment locks the invoice, re-validates the totals and stores the
	// adjustment while updating invoices.total_amount atomically.
	ApplyAdjustment(ctx context.Context, adj *InvoiceAdjustment, maxDiscountPct decimal.Decimal) error
	ListAdjustments(ctx context.Context, invoiceID uuid.UUID) ([]InvoiceAdjustment, error)
}
