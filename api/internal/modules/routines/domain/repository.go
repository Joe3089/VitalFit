package routinedomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type RoutineRepository interface {
	CreateRoutine(ctx context.Context, routine *Routine) error
	AssignRoutine(ctx context.Context, userRoutine *UserRoutine) error
	GetClientRoutines(ctx context.Context, clientID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*UserRoutine, int64, error)
	CreateExercise(ctx context.Context, exercise *Exercise) error
	GetExercises(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Exercise, int64, error)
	GetRoutinesByCreator(ctx context.Context, creatorID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*Routine, int64, error)
	GetRoutineByID(ctx context.Context, routineID uuid.UUID) (*Routine, error)
	GetAllRoutines(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Routine, int64, error)
	DeleteRoutine(ctx context.Context, routineID uuid.UUID) error
	UpdateRoutine(ctx context.Context, routine *Routine) error
	GetUserRoutineByID(ctx context.Context, userRoutineID uuid.UUID) (*UserRoutine, error)
	MarkRoutineCompletion(ctx context.Context, userRoutineID uuid.UUID) error
}
