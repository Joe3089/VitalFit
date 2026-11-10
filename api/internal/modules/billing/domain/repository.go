package billingdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type BillingRepository interface {
	CreateInvoice(ctx context.Context, invoice *Invoice) error
	GetInvoices(ctx context.Context, fq pagination.PaginatedFeedQuery, branchIDs []uuid.UUID) ([]*Invoice, int64, error)
	GetInvoiceByID(ctx context.Context, invoiceID uuid.UUID) (*Invoice, error)

	UpdateInvoiceStatus(ctx context.Context, invoice *Invoice) error
	AddPaymentToInvoice(ctx context.Context, payment *Payment) error
	GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*Payment, error)
	UpdatePaymentStatus(ctx context.Context, payment *Payment) error
	GetClientIvoices(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*Invoice, int64, error)
}

type PaymentMethodsRepository interface {
	GetPaymentMethods(ctx context.Context) ([]*PaymentMethods, error)
	GetPaymentMethodByID(ctx context.Context, methodID uuid.UUID) (*PaymentMethods, error)

	CreatePaymentMethod(ctx context.Context, paymentMethod *PaymentMethods) error
	UpdatePaymentMethod(ctx context.Context, paymentMethod *PaymentMethods) error
	DeletePaymentMethod(ctx context.Context, methodID uuid.UUID) error

	AddPaymentMethodsToBranch(ctx context.Context, branchMethod []*PaymentMethodsBranch) error
	DeletePaymentMethodsFromBranch(ctx context.Context, branchID, methodID uuid.UUID) error
	GetPaymentMethodsFromBranch(ctx context.Context, branchID uuid.UUID) ([]*PaymentMethodsBranch, error)
	UpsertBranchPaymentConfig(ctx context.Context, branchMethod *PaymentMethodsBranch) error
	GetBranchPaymentMethodByID(ctx context.Context, branchID uuid.UUID, methodID uuid.UUID) (*PaymentMethodsBranch, error)
	GetPaymentMethodsByType(ctx context.Context, methodType PaymentMethodTypeEnum) ([]*PaymentMethods, error)
}

type FiscalDocumentRepository interface {
	CreateFiscalDocumentType(ctx context.Context, docType *FiscalDocumentType) error
	GetFiscalDocumentTypes(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*FiscalDocumentType, error)
	GetFiscalDocumentTypesTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	GetFiscalDocumentTypeByID(ctx context.Context, docTypeID uuid.UUID) (*FiscalDocumentType, error)
	UpdateFiscalDocumentType(ctx context.Context, docType *FiscalDocumentType) error
	DeleteFiscalDocumentType(ctx context.Context, docTypeID uuid.UUID) error
	GetFiscalDocumentTypeByName(ctx context.Context, name string) (*FiscalDocumentType, error)
}

type BillingStoreCacheRepository interface {
	SetRates(ctx context.Context, rates map[string]float64) error
	GetRates(ctx context.Context) (map[string]float64, error)
	DeleteRates(ctx context.Context) error
	SetSpecificTimeRateForCurrency(ctx context.Context, date string, currency string, rate float64) error
	GetSpecificTimeRateForCurrency(ctx context.Context, date string, currency string) (float64, error)
}
