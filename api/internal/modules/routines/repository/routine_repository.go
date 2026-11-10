package routinerepository

import (
	"context"

	"time"

	"github.com/google/uuid"
	routinedomain "github.com/vitalfit/api/internal/modules/routines/domain"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type RoutineStore struct {
	db *gorm.DB
}

func NewRoutineStore(db *gorm.DB) *RoutineStore {
	return &RoutineStore{
		db: db,
	}

}

func (s *RoutineStore) CreateRoutine(ctx context.Context, routine *routinedomain.Routine) error {
	return s.db.WithContext(ctx).Create(routine).Error
}

func (s *RoutineStore) AssignRoutine(ctx context.Context, userRoutine *routinedomain.UserRoutine) error {
	return s.db.WithContext(ctx).Create(userRoutine).Error
}

func (s *RoutineStore) GetClientRoutines(ctx context.Context, clientID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*routinedomain.UserRoutine, int64, error) {
	var routines []*routinedomain.UserRoutine
	var total int64

	query := s.db.WithContext(ctx).Model(&routinedomain.UserRoutine{}).
		Where("client_id = ? AND status = ?", clientID, routinedomain.StatusActive)

	if fq.Search != "" {
		query = query.Joins("JOIN routines ON routines.routine_id = user_routines.routine_id").
			Where("routines.name ILIKE ?", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Routine.Creator").
		Preload("Routine").
		Preload("Instructor.User").
		Limit(fq.Limit).Offset(fq.Page*fq.Limit - fq.Limit).Order("assigned_date " + fq.Sort).
		Find(&routines).Error
	return routines, total, err
}

func (s *RoutineStore) CreateExercise(ctx context.Context, exercise *routinedomain.Exercise) error {
	return s.db.WithContext(ctx).Create(exercise).Error
}

func (s *RoutineStore) GetExercises(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*routinedomain.Exercise, int64, error) {
	var exercises []*routinedomain.Exercise
	var total int64

	query := s.db.WithContext(ctx).Model(&routinedomain.Exercise{})

	if fq.Search != "" {
		query = query.Where("name ILIKE ? OR muscle_group::text ILIKE ?", "%"+fq.Search+"%", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(fq.Limit).Offset(fq.Page*fq.Limit - fq.Limit).Order("created_at " + fq.Sort).Find(&exercises).Error
	return exercises, total, err
}

func (s *RoutineStore) GetRoutinesByCreator(ctx context.Context, creatorID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*routinedomain.Routine, int64, error) {
	var routines []*routinedomain.Routine
	var total int64

	query := s.db.WithContext(ctx).Model(&routinedomain.Routine{}).Where("creator_id = ?", creatorID)

	if fq.Search != "" {
		query = query.Where("name ILIKE ?", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("created_at " + fq.Sort).
		Find(&routines).Error

	return routines, total, err
}

func (s *RoutineStore) GetRoutineByID(ctx context.Context, routineID uuid.UUID) (*routinedomain.Routine, error) {
	var routine routinedomain.Routine
	err := s.db.WithContext(ctx).
		Preload("RoutineExercises.Exercise").
		Where("routine_id = ?", routineID).
		First(&routine).Error
	return &routine, err
}

func (s *RoutineStore) GetAllRoutines(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*routinedomain.Routine, int64, error) {
	var routines []*routinedomain.Routine
	var total int64

	query := s.db.WithContext(ctx).Model(&routinedomain.Routine{})

	if fq.Search != "" {
		query = query.Where("name ILIKE ?", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(fq.Limit).Offset(fq.Page*fq.Limit - fq.Limit).Order("created_at " + fq.Sort).Find(&routines).Error

	return routines, total, err
}

func (s *RoutineStore) DeleteRoutine(ctx context.Context, routineID uuid.UUID) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete assigned routines (UserRoutine) - Hard delete as it has no DeletedAt
		if err := tx.Where("routine_id = ?", routineID).Delete(&routinedomain.UserRoutine{}).Error; err != nil {
			return err
		}
		// Delete routine (Soft delete as it has DeletedAt)
		if err := tx.Delete(&routinedomain.Routine{}, routineID).Error; err != nil {
			return err
		}
		return nil
	})
}

func (s *RoutineStore) GetUserRoutineByID(ctx context.Context, userRoutineID uuid.UUID) (*routinedomain.UserRoutine, error) {
	var userRoutine routinedomain.UserRoutine
	err := s.db.WithContext(ctx).
		Where("user_routine_id = ?", userRoutineID).
		First(&userRoutine).Error
	return &userRoutine, err
}

func (s *RoutineStore) MarkRoutineCompletion(ctx context.Context, userRoutineID uuid.UUID) error {
	return s.db.WithContext(ctx).Model(&routinedomain.UserRoutine{}).
		Where("user_routine_id = ?", userRoutineID).
		Updates(map[string]interface{}{
			"completion_count":  gorm.Expr("completion_count + 1"),
			"last_completed_at": time.Now(),
		}).Error
}

func (s *RoutineStore) UpdateRoutine(ctx context.Context, routine *routinedomain.Routine) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(routine).Omit("CreatorID").Save(routine).Error; err != nil {
			return err
		}

		if len(routine.RoutineExercises) > 0 {
			if err := tx.Where("routine_id = ?", routine.RoutineID).Delete(&routinedomain.RoutineExercise{}).Error; err != nil {
				return err
			}
			for i := range routine.RoutineExercises {
				routine.RoutineExercises[i].RoutineID = routine.RoutineID
			}
			if err := tx.Create(&routine.RoutineExercises).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
