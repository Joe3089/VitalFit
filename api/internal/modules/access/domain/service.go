package accessdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type AcessServiceInterface interface {
	ProcessCheckIn(ctx context.Context, userID, branchID uuid.UUID) (*CheckInResponse, error)
	GetClientAttendanceHistory(ctx context.Context, clientID uuid.UUID, startDate, endDate *string, fq pagination.PaginatedFeedQuery) ([]*AttendanceLog, int64, error)
	GetClientServiceUsage(ctx context.Context, clientID uuid.UUID, startDate, endDate *string, fq pagination.PaginatedFeedQuery) ([]*AttendanceLog, int64, error)
	GetClassAttendanceHistory(ctx context.Context, classID uuid.UUID, startDate, endDate, status *string) ([]*AttendanceLog, error)
	CalculateClientScores(ctx context.Context) ([]ClientScore, error)
	UpdateClientScore(ctx context.Context, userID uuid.UUID, score int) error
}
