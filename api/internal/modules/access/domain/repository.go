package accessdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type AccessRepository interface {
	LogAttendance(ctx context.Context, attendance *AttendanceLog) error
	UpdateLogAttendance(ctx context.Context, attendance *AttendanceLog) error
	GetClassAttendanceHistory(ctx context.Context, classID uuid.UUID, startDate, endDate, status *string) ([]*AttendanceLog, error)
	GetClientAttendanceHistory(ctx context.Context, clientID uuid.UUID, startDate, endDate *string, fq pagination.PaginatedFeedQuery) ([]*AttendanceLog, int64, error)
	GetClientServiceUsage(ctx context.Context, clientID uuid.UUID, startDate, endDate *string, fq pagination.PaginatedFeedQuery) ([]*AttendanceLog, int64, error)
	GetAttendanceCounts(ctx context.Context) ([]ClientScore, error)
	UpdateClientScore(ctx context.Context, userID uuid.UUID, score int) error
}
