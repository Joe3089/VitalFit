package auditrepository

import (
	"context"

	auditdomain "github.com/vitalfit/api/internal/modules/audit/domain"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type AuditStore struct {
	db *gorm.DB
}

func NewAuditStore(db *gorm.DB) *AuditStore {
	return &AuditStore{
		db: db,
	}
}

func (s *AuditStore) CreateLog(ctx context.Context, log *auditdomain.AuditLog) error {
	return s.db.WithContext(ctx).Create(log).Error
}

func (s *AuditStore) GetUserLogs(ctx context.Context, userID string, fq pagination.PaginatedFeedQuery) ([]*auditdomain.AuditLog, int64, error) {
	var logs []*auditdomain.AuditLog
	var total int64

	query := s.db.WithContext(ctx).Model(&auditdomain.AuditLog{}).Where("user_id = ?", userID)

	if fq.Search != "" {
		query = query.Where("path ILIKE ? OR method ILIKE ?", "%"+fq.Search+"%", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("created_at " + fq.Sort).
		Find(&logs).Error

	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (s *AuditStore) GetAllLogs(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*auditdomain.AuditLog, int64, error) {
	var logs []*auditdomain.AuditLog
	var total int64

	query := s.db.WithContext(ctx).Model(&auditdomain.AuditLog{})

	if fq.Search != "" {
		query = query.Where("path ILIKE ? OR method ILIKE ?", "%"+fq.Search+"%", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("created_at " + fq.Sort).
		Find(&logs).Error

	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
