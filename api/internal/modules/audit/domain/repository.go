package auditdomain

import (
	"context"

	"github.com/vitalfit/api/pkg/pagination"
)

type AuditRepository interface {
	CreateLog(ctx context.Context, log *AuditLog) error
	GetUserLogs(ctx context.Context, userID string, fq pagination.PaginatedFeedQuery) ([]*AuditLog, int64, error)
	GetAllLogs(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*AuditLog, int64, error)
}
