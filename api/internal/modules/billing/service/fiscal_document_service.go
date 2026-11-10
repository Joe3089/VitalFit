package billingservice

import (
	"context"

	"github.com/google/uuid"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	"github.com/vitalfit/api/pkg/pagination"
)

func (s *BillingService) CreateFiscalDocumentType(ctx context.Context, docType *billingdomain.FiscalDocumentType) error {
	return s.store.FiscalDocuments.CreateFiscalDocumentType(ctx, docType)
}

func (s *BillingService) GetFiscalDocumentTypes(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*billingdomain.FiscalDocumentType, error) {
	return s.store.FiscalDocuments.GetFiscalDocumentTypes(ctx, fq)
}

func (s *BillingService) GetFiscalDocumentTypesTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	return s.store.FiscalDocuments.GetFiscalDocumentTypesTotal(ctx, fq)
}

func (s *BillingService) GetFiscalDocumentTypeByID(ctx context.Context, docTypeID uuid.UUID) (*billingdomain.FiscalDocumentType, error) {
	return s.store.FiscalDocuments.GetFiscalDocumentTypeByID(ctx, docTypeID)
}

func (s *BillingService) UpdateFiscalDocumentType(ctx context.Context, docType *billingdomain.FiscalDocumentType) error {
	return s.store.FiscalDocuments.UpdateFiscalDocumentType(ctx, docType)
}

func (s *BillingService) DeleteFiscalDocumentType(ctx context.Context, docTypeID uuid.UUID) error {
	return s.store.FiscalDocuments.DeleteFiscalDocumentType(ctx, docTypeID)
}
