package billingrepository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/google/uuid"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type FiscalDocumentStore struct {
	db *gorm.DB
}

func NewFiscalDocumentStore(db *gorm.DB) *FiscalDocumentStore {
	return &FiscalDocumentStore{db: db}

}

func (s *FiscalDocumentStore) CreateFiscalDocumentType(ctx context.Context, docType *billingdomain.FiscalDocumentType) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		err := tx.WithContext(ctx).Create(docType).Error
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return shared_errors.ErrConflict
			}
			return err
		}
		return nil
	})
}

func (s *FiscalDocumentStore) GetFiscalDocumentTypes(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*billingdomain.FiscalDocumentType, error) {
	var docTypes []*billingdomain.FiscalDocumentType
	query := s.db.WithContext(ctx)
	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where("name ILIKE ?", searchQuery)
	}

	err := query.Limit(fq.Limit).Offset(fq.Page*fq.Limit - fq.Limit).Order("created_at " + fq.Sort).Find(&docTypes).Error
	return docTypes, err
}

func (s *FiscalDocumentStore) GetFiscalDocumentTypesTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	var count int64
	query := s.db.WithContext(ctx).Model(&billingdomain.FiscalDocumentType{})
	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where("name ILIKE ?", searchQuery)
	}
	err := query.Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (s *FiscalDocumentStore) GetFiscalDocumentTypeByID(ctx context.Context, docTypeID uuid.UUID) (*billingdomain.FiscalDocumentType, error) {
	var docType billingdomain.FiscalDocumentType
	err := s.db.WithContext(ctx).First(&docType, "document_type_id = ?", docTypeID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &docType, nil
}

func (s *FiscalDocumentStore) UpdateFiscalDocumentType(ctx context.Context, docType *billingdomain.FiscalDocumentType) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		result := tx.WithContext(ctx).Model(&billingdomain.FiscalDocumentType{}).Where("document_type_id = ?", docType.DocumentTypeID).Updates(docType)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}
		return nil
	})
}

func (s *FiscalDocumentStore) DeleteFiscalDocumentType(ctx context.Context, docTypeID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		result := tx.WithContext(ctx).Delete(&billingdomain.FiscalDocumentType{}, "document_type_id = ?", docTypeID)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}
		return nil
	})
}

func (s *FiscalDocumentStore) GetFiscalDocumentTypeByName(ctx context.Context, name string) (*billingdomain.FiscalDocumentType, error) {
	var docType billingdomain.FiscalDocumentType
	err := s.db.WithContext(ctx).Where("name = ?", name).First(&docType).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return &docType, nil
}
