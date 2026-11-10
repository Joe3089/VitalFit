package auditservice

import (
	"context"

	auditdomain "github.com/vitalfit/api/internal/modules/audit/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type AuditService struct {
	store store.Storage
}

func NewAuditService(store store.Storage) *AuditService {
	return &AuditService{
		store: store,
	}
}

func (s *AuditService) CreateLog(ctx context.Context, log *auditdomain.AuditLog) error {
	return s.store.Audit.CreateLog(ctx, log)

}

func (s *AuditService) GetUserLogs(ctx context.Context, userID string, fq pagination.PaginatedFeedQuery) ([]*auditdomain.AuditLog, int64, error) {
	return s.store.Audit.GetUserLogs(ctx, userID, fq)
}

func (s *AuditService) GetAllLogs(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*auditdomain.AuditLog, int64, error) {
	return s.store.Audit.GetAllLogs(ctx, fq)
}
