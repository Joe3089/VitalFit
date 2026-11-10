package routineservices

import (
	"context"
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	routinedomain "github.com/vitalfit/api/internal/modules/routines/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type RoutineService struct {
	store store.Storage
}

func NewRoutineService(store store.Storage) *RoutineService {
	return &RoutineService{
		store: store,
	}

}

func (s *RoutineService) CreateRoutine(ctx context.Context, routine *routinedomain.Routine) error {
	return s.store.Routine.CreateRoutine(ctx, routine)
}

func (s *RoutineService) AssignRoutine(ctx context.Context, instructorID, clientID, routineID uuid.UUID, dueDate *time.Time) error {
	if _, err := s.store.Routine.GetRoutineByID(ctx, routineID); err != nil {
		return err
	}

	assignment := &routinedomain.UserRoutine{
		ClientID:     clientID,
		InstructorID: &instructorID,
		RoutineID:    routineID,
		Status:       routinedomain.StatusActive,
		DueDate:      dueDate,
		AssignedDate: time.Now(),
		IsActive:     true,
	}

	return s.store.Routine.AssignRoutine(ctx, assignment)
}

func (s *RoutineService) GetClientRoutines(ctx context.Context, clientID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*routinedomain.UserRoutine, int64, error) {
	return s.store.Routine.GetClientRoutines(ctx, clientID, fq)
}

func (s *RoutineService) CreateExercise(ctx context.Context, exercise *routinedomain.Exercise) error {
	return s.store.Routine.CreateExercise(ctx, exercise)
}

func (s *RoutineService) GetExercises(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*routinedomain.Exercise, int64, error) {
	return s.store.Routine.GetExercises(ctx, fq)
}

func (s *RoutineService) GetRoutinesByCreator(ctx context.Context, creatorID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*routinedomain.Routine, int64, error) {
	return s.store.Routine.GetRoutinesByCreator(ctx, creatorID, fq)
}

func (s *RoutineService) GetRoutineByID(ctx context.Context, routineID uuid.UUID) (*routinedomain.Routine, error) {
	return s.store.Routine.GetRoutineByID(ctx, routineID)
}

func (s *RoutineService) GetAllRoutines(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*routinedomain.Routine, int64, error) {
	return s.store.Routine.GetAllRoutines(ctx, fq)
}

func (s *RoutineService) DeleteRoutine(ctx context.Context, routineID uuid.UUID, user *authdomain.Users) error {
	routine, err := s.store.Routine.GetRoutineByID(ctx, routineID)
	if err != nil {
		return err
	}

	isCreator := routine.CreatorID != nil && *routine.CreatorID == user.UserID
	isSuperAdmin := user.Role.Name == "super_admin"

	if !isCreator && !isSuperAdmin {
		return shared_errors.ErrForbidden
	}

	return s.store.Routine.DeleteRoutine(ctx, routineID)
}

func (s *RoutineService) UpdateRoutine(ctx context.Context, routineID uuid.UUID, routine *routinedomain.Routine, user *authdomain.Users) error {
	existingRoutine, err := s.store.Routine.GetRoutineByID(ctx, routineID)
	if err != nil {
		return err
	}

	isCreator := existingRoutine.CreatorID != nil && *existingRoutine.CreatorID == user.UserID
	isSuperAdmin := user.Role.Name == "super_admin"

	if !isCreator && !isSuperAdmin {
		return shared_errors.ErrForbidden
	}
	routine.RoutineID = routineID
	return s.store.Routine.UpdateRoutine(ctx, routine)
}

func (s *RoutineService) MarkRoutineCompletion(ctx context.Context, userRoutineID uuid.UUID, userID uuid.UUID) error {
	userRoutine, err := s.store.Routine.GetUserRoutineByID(ctx, userRoutineID)
	if err != nil {
		return err
	}

	if userRoutine.ClientID != userID {
		return shared_errors.ErrForbidden
	}

	return s.store.Routine.MarkRoutineCompletion(ctx, userRoutineID)
}
