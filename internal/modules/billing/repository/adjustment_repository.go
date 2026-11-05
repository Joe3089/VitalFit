package billingrepository

import (
	"context"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

type AdjustmentStore struct {
	db *gorm.DB
}

func NewAdjustmentStore(db *gorm.DB) *AdjustmentStore {
	return &AdjustmentStore{db: db}
}

func (s *AdjustmentStore) ApplyAdjustment(ctx context.Context, adj *billingdomain.InvoiceAdjustment, maxDiscountPct decimal.Decimal) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var inv struct {
			Status      string
			TotalAmount decimal.Decimal
		}
		res := tx.Raw(`SELECT status, total_amount FROM invoices WHERE invoice_id = ? AND deleted_at IS NULL FOR UPDATE`, adj.InvoiceID).Scan(&inv)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}
		if inv.Status != "Unpaid" && inv.Status != "Overdue" {
			return billingdomain.ErrAdjustmentInvalidInvoice
		}

		var paid, previousDiscounts decimal.Decimal
		if err := tx.Raw(`SELECT COALESCE(SUM(amount_base), 0) FROM payments WHERE invoice_id = ? AND status = 'Completed' AND deleted_at IS NULL`, adj.InvoiceID).Scan(&paid).Error; err != nil {
			return err
		}
		if err := tx.Raw(`SELECT COALESCE(SUM(amount), 0) FROM invoice_adjustments WHERE invoice_id = ?`, adj.InvoiceID).Scan(&previousDiscounts).Error; err != nil {
			return err
		}

		amount := adj.DiscountValue
		if adj.DiscountType == "Percentage" {
			amount = inv.TotalAmount.Mul(adj.DiscountValue).Div(decimal.NewFromInt(100))
		}
		amount = amount.Round(2)
		if amount.LessThanOrEqual(decimal.Zero) {
			return shared_errors.ErrBadRequest
		}

		// The policy cap applies to the accumulated discount over the original total.
		originalTotal := inv.TotalAmount.Add(previousDiscounts)
		if originalTotal.GreaterThan(decimal.Zero) && maxDiscountPct.GreaterThan(decimal.Zero) {
			accumulatedPct := previousDiscounts.Add(amount).Div(originalTotal).Mul(decimal.NewFromInt(100))
			if accumulatedPct.GreaterThan(maxDiscountPct) {
				return billingdomain.ErrAdjustmentExceedsPolicy
			}
		}

		newTotal := inv.TotalAmount.Sub(amount)
		if newTotal.LessThan(paid) {
			return billingdomain.ErrAdjustmentBelowPaid
		}

		adj.Amount = amount
		adj.PreviousTotal = inv.TotalAmount
		adj.NewTotal = newTotal
		if err := tx.Create(adj).Error; err != nil {
			return err
		}
		return tx.Exec(`UPDATE invoices SET total_amount = ?, updated_at = NOW() WHERE invoice_id = ?`, newTotal, adj.InvoiceID).Error
	})
}

func (s *AdjustmentStore) ListAdjustments(ctx context.Context, invoiceID uuid.UUID) ([]billingdomain.InvoiceAdjustment, error) {
	var rows []billingdomain.InvoiceAdjustment
	err := s.db.WithContext(ctx).Table("invoice_adjustments a").
		Select("a.*, COALESCE(u.first_name || ' ' || u.last_name, '') AS applied_by_name").
		Joins("LEFT JOIN users u ON u.user_id = a.applied_by").
		Where("a.invoice_id = ?", invoiceID).
		Order("a.created_at DESC").
		Scan(&rows).Error
	return rows, err
}
