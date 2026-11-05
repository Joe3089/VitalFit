package scheduledomain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AttendanceHistoryFilter struct {
	ClassID   uuid.UUID
	StartDate *time.Time
	EndDate   *time.Time
	Status    *string
}

type ScheduleServiceInterface interface {
	CreateClass(ctx context.Context, class *Class) error
	CreateClasses(ctx context.Context, classes []Class) error
	GetClassesByBranch(ctx context.Context, branchID uuid.UUID, startDate, endDate *time.Time) ([]Class, error)
	GetClassByID(ctx context.Context, classID uuid.UUID) (*Class, error)
	UpdateClass(ctx context.Context, class *Class) error
	DeleteClass(ctx context.Context, classID uuid.UUID) error
	GetUpcomingClassesByBranch(ctx context.Context, branchID uuid.UUID, startDate, endDate *time.Time) ([]Class, error)
	GetClassAttendanceHistory(ctx context.Context, filter AttendanceHistoryFilter) ([]interface{}, error)
	GetClassesByInstructor(ctx context.Context, userID uuid.UUID, branchID *uuid.UUID, startDate, endDate *time.Time) ([]Class, error)
	CancelClass(ctx context.Context, classID uuid.UUID, reason string, cancelledBy uuid.UUID) (*Class, []uuid.UUID, error)
}
