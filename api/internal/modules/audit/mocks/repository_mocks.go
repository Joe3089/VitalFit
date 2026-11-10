package auditmocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	auditdomain "github.com/vitalfit/api/internal/modules/audit/domain"
	"github.com/vitalfit/api/pkg/pagination"
)

type MockAuditStore struct {
	mock.Mock
}

func NewMockAuditStore() *MockAuditStore {
	return &MockAuditStore{}
}

func (m *MockAuditStore) CreateLog(ctx context.Context, log *auditdomain.AuditLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockAuditStore) GetUserLogs(ctx context.Context, userID string, fq pagination.PaginatedFeedQuery) ([]*auditdomain.AuditLog, int64, error) {
	args := m.Called(ctx, userID, fq)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*auditdomain.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuditStore) GetAllLogs(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*auditdomain.AuditLog, int64, error) {
	args := m.Called(ctx, fq)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*auditdomain.AuditLog), args.Get(1).(int64), args.Error(2)
}
