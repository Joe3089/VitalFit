package scheduleservice

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
)

type ScheduleService struct {
	store store.Storage
}

func NewScheduleService(store store.Storage) *ScheduleService {
	return &ScheduleService{store: store}
}

// ----------------------------------------
// CreateClass
// ----------------------------------------

func (s *ScheduleService) CreateClass(ctx context.Context, class *scheduledomain.Class) error {

	// Validación básica: start < end
	if !class.StartsAt.Before(class.EndsAt) {
		return errors.New("the class start time must be before the end time")
	}

	return s.store.Schedule.CreateClass(ctx, class)
}

// ----------------------------------------
// CreateClasses
// ----------------------------------------

func (s *ScheduleService) CreateClasses(ctx context.Context, classes []scheduledomain.Class) error {
	for _, class := range classes {
		if !class.StartsAt.Before(class.EndsAt) {
			return errors.New("the class start time must be before the end time")
		}
	}
	return s.store.Schedule.CreateClasses(ctx, classes)
}

// ----------------------------------------
// GetClassesByBranch
// ----------------------------------------

func (s *ScheduleService) GetClassesByBranch(ctx context.Context, branchID uuid.UUID, startDate, endDate *time.Time) ([]scheduledomain.Class, error) {
	return s.store.Schedule.GetClassesByBranch(ctx, branchID, startDate, endDate)
}

func (s *ScheduleService) GetUpcomingClassesByBranch(ctx context.Context, branchID uuid.UUID, startDate, endDate *time.Time) ([]scheduledomain.Class, error) {
	return s.store.Schedule.GetUpcomingClassesByBranch(ctx, branchID, startDate, endDate)
}

func (s *ScheduleService) GetClassesByInstructor(ctx context.Context, userID uuid.UUID, branchID *uuid.UUID, startDate, endDate *time.Time) ([]scheduledomain.Class, error) {
	return s.store.Schedule.GetClassesByInstructor(ctx, userID, branchID, startDate, endDate)
}

// ----------------------------------------
// GetClassByID
// ----------------------------------------

func (s *ScheduleService) GetClassByID(ctx context.Context, classID uuid.UUID) (*scheduledomain.Class, error) {
	return s.store.Schedule.GetClassByID(ctx, classID)
}

// ----------------------------------------
// UpdateClass
// ----------------------------------------

func (s *ScheduleService) UpdateClass(ctx context.Context, class *scheduledomain.Class) error {

	// Validar que si vienen fechas opcionales, estas tengan sentido
	if !class.StartsAt.IsZero() && !class.EndsAt.IsZero() {
		if !class.StartsAt.Before(class.EndsAt) {
			return errors.New("the class start time must be before the end time")
		}
	}

	// Stamp updated time
	class.UpdatedAt = time.Now()

	return s.store.Schedule.UpdateClass(ctx, class)
}

// ----------------------------------------
// DeleteClass
// ----------------------------------------

func (s *ScheduleService) DeleteClass(ctx context.Context, classID uuid.UUID) error {
	return s.store.Schedule.DeleteClass(ctx, classID)
}

// ----------------------------------------
// CancelClass (HU-CLA-03)
// ----------------------------------------

func (s *ScheduleService) CancelClass(ctx context.Context, classID uuid.UUID, reason string, cancelledBy uuid.UUID) (*scheduledomain.Class, []uuid.UUID, error) {
	if strings.TrimSpace(reason) == "" {
		return nil, nil, errors.New("a cancellation reason is required")
	}
	class, err := s.store.Schedule.GetClassByID(ctx, classID)
	if err != nil {
		return nil, nil, err
	}
	if class.Status == scheduledomain.ClassStatusCancelled {
		return nil, nil, shared_errors.ErrClassAlreadyCancelled
	}
	if class.EndsAt.Before(time.Now()) {
		return nil, nil, errors.New("cannot cancel a class that already finished")
	}
	affected, err := s.store.Schedule.CancelClass(ctx, class, strings.TrimSpace(reason), cancelledBy)
	if err != nil {
		return nil, nil, err
	}
	return class, affected, nil
}

// ----------------------------------------
// GetClassAttendanceHistory
// ----------------------------------------

func (s *ScheduleService) GetClassAttendanceHistory(ctx context.Context, filter scheduledomain.AttendanceHistoryFilter) ([]interface{}, error) {
	// Verify the class exists first
	_, err := s.store.Schedule.GetClassByID(ctx, filter.ClassID)
	if err != nil {
		return nil, err
	}

	// Convert time.Time pointers to string pointers for repository
	var startDate, endDate *string
	if filter.StartDate != nil {
		start := filter.StartDate.Format("2006-01-02T15:04:05Z07:00")
		startDate = &start
	}
	if filter.EndDate != nil {
		end := filter.EndDate.Format("2006-01-02T15:04:05Z07:00")
		endDate = &end
	}

	// Get attendance history from access repository
	attendances, err := s.store.Access.GetClassAttendanceHistory(ctx, filter.ClassID, startDate, endDate, filter.Status)
	if err != nil {
		return nil, err
	}

	// Convert to []interface{} to avoid circular dependency
	result := make([]interface{}, len(attendances))
	for i, attendance := range attendances {
		result[i] = attendance
	}
	return result, nil
}
