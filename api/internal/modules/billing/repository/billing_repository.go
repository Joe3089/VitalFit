package billingrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type Billingstore struct {
	db *gorm.DB
}

func NewBillingStore(db *gorm.DB) *Billingstore {
	return &Billingstore{
		db: db,
	}
}

func (bs *Billingstore) CreateInvoice(ctx context.Context, invoice *billingdomain.Invoice) error {
	return db.WithTX(bs.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).Create(invoice).Error
	})
}

func (bs *Billingstore) GetInvoiceByID(ctx context.Context, invoiceID uuid.UUID) (*billingdomain.Invoice, error) {
	var invoice billingdomain.Invoice
	err := bs.db.WithContext(ctx).Preload("InvoiceItems").Preload("Payments").First(&invoice, "invoice_id = ?", invoiceID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &invoice, nil
}

func (bs *Billingstore) AddPaymentToInvoice(ctx context.Context, payment *billingdomain.Payment) error {
	return db.WithTX(bs.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).Create(payment).Error
	})

}

func (bs *Billingstore) GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*billingdomain.Payment, error) {
	var payment billingdomain.Payment
	err := bs.db.WithContext(ctx).First(&payment, "payment_id = ?", paymentID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return &payment, nil
}

func (bs *Billingstore) UpdatePaymentStatus(ctx context.Context, payment *billingdomain.Payment) error {
	return db.WithTX(bs.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).Model(payment).Update("status", payment.Status).Error
	})
}

func (bs *Billingstore) UpdateInvoiceStatus(ctx context.Context, invoice *billingdomain.Invoice) error {
	return db.WithTX(bs.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).Model(invoice).Update("status", invoice.Status).Error
	})
}

func (bs *Billingstore) GetClientIvoices(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*billingdomain.Invoice, int64, error) {
	var invoices []*billingdomain.Invoice
	var total int64

	query := bs.db.WithContext(ctx).Model(&billingdomain.Invoice{}).Where("user_id = ?", userID)

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where("invoice_number ILIKE ? OR status::text ILIKE ?", searchQuery, searchQuery)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortDirection := fq.Sort
	if sortDirection == "" {
		sortDirection = "desc"
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := query.
		Order("issue_date " + sortDirection).
		Limit(fq.Limit).
		Offset((page - 1) * fq.Limit).
		Find(&invoices).Error

	if err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (bs *Billingstore) GetInvoices(ctx context.Context, fq pagination.PaginatedFeedQuery, branchIDs []uuid.UUID) ([]*billingdomain.Invoice, int64, error) {
	var invoices []*billingdomain.Invoice
	var total int64

	query := bs.db.WithContext(ctx).Model(&billingdomain.Invoice{})

	if branchIDs != nil {
		if len(branchIDs) == 0 {
			return []*billingdomain.Invoice{}, 0, nil
		}
		query = query.Where("branch_id IN ?", branchIDs)
	}

	if fq.Search != "" {
		query = query.Joins("User")

		searchQuery := "%" + fq.Search + "%"
		query = query.Where(
			"invoices.invoice_number ILIKE ? OR \"User\".first_name ILIKE ? OR \"User\".last_name ILIKE ? OR \"User\".email ILIKE ?",
			searchQuery, searchQuery, searchQuery, searchQuery,
		)
	}

	if fq.Status != "" {
		query = query.Where("invoices.status = ?", fq.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortDirection := fq.Sort
	if sortDirection == "" {
		sortDirection = "desc"
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := query.Preload("User").
		Order("invoices.issue_date " + sortDirection).
		Limit(fq.Limit).
		Offset((page - 1) * fq.Limit).
		Find(&invoices).Error

	return invoices, total, err
}
