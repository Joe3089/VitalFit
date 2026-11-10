package instructorservices

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type InstructorServices struct {
	store  store.Storage
	config config.Config
}

func NewInstructorServices(store store.Storage, config config.Config) *InstructorServices {
	return &InstructorServices{
		store:  store,
		config: config,
	}
}

func (s *InstructorServices) CreateInstructor(ctx context.Context, instructor *instructordomain.Instructor, token string) error {
	role, err := s.store.Roles.GetByName(ctx, "instructor")
	if err != nil {
		return err
	}
	instructor.User.RoleID = role.RoleID
	if err = s.store.Instructor.CreateAndInvitate(ctx, instructor, token, s.config.Mail.Exp); err != nil {
		return err
	}
	return nil
}

func (s *InstructorServices) GetInstructors(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*instructordomain.Instructor, error) {
	instructors, err := s.store.Instructor.GetInstructors(ctx, fq)
	if err != nil {
		return nil, err
	}
	return instructors, nil
}

func (s *InstructorServices) GetInstructorsFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	total, err := s.store.Instructor.GetInstructorsFTotal(ctx, fq)
	if err != nil {
		return 0, err
	}
	return total, nil
}

func (s *InstructorServices) DeleteInstructor(ctx context.Context, instructorID uuid.UUID) error {
	err := s.store.Instructor.Delete(ctx, instructorID)
	if err != nil {
		if err == shared_errors.ErrNotFound {
			return shared_errors.ErrNotFound
		}
		return err
	}
	return nil
}

func (s *InstructorServices) GetInstructorByID(ctx context.Context, instructorID uuid.UUID) (*instructordomain.Instructor, error) {
	instructor, err := s.store.Instructor.GetByID(ctx, instructorID)
	if err != nil {
		if err == shared_errors.ErrNotFound {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return instructor, nil
}

func (s *InstructorServices) GetInstructorByUserID(ctx context.Context, userID uuid.UUID) (*instructordomain.Instructor, error) {
	instructor, err := s.store.Instructor.GetByUserID(ctx, userID)
	if err != nil {
		if err == shared_errors.ErrNotFound {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return instructor, nil
}

func (s *InstructorServices) GetSummary(ctx context.Context) (*instructordomain.InstructorSummary, error) {
	summary, err := s.store.Instructor.GetSummary(ctx)
	if err != nil {
		return nil, err
	}
	return summary, nil
}

func (s *InstructorServices) UpdateInstructor(ctx context.Context, instructor *instructordomain.Instructor) error {
	err := s.store.Instructor.Update(ctx, instructor)
	if err != nil {
		if err == shared_errors.ErrNotFound {
			return shared_errors.ErrNotFound
		}
		return err
	}
	return nil
}

func (s *InstructorServices) AssignInstructorSpecialty(ctx context.Context, instructorID uuid.UUID, specialties []uuid.UUID) error {
	return s.store.Instructor.AssignInstructorSpecialty(ctx, instructorID, specialties)
}

func (s *InstructorServices) DeleteInstructorSpecialty(ctx context.Context, instructorID uuid.UUID, specialtyID uuid.UUID) error {
	return s.store.Instructor.DeleteInstructorSpecialty(ctx, instructorID, specialtyID)
}

func (s *InstructorServices) GetAssignedClients(ctx context.Context, instructorID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*instructordomain.AssignedClient, error) {
	clients, err := s.store.Instructor.GetAssignedClients(ctx, instructorID, fq)
	if err != nil {
		return nil, err
	}
	return clients, nil
}

func (s *InstructorServices) GetAssignedClientsTotal(ctx context.Context, instructorID uuid.UUID, fq pagination.PaginatedFeedQuery) (int64, error) {
	total, err := s.store.Instructor.GetAssignedClientsTotal(ctx, instructorID, fq)
	if err != nil {
		return 0, err
	}
	return total, nil
}

func (s *InstructorServices) GetStudentsTodayCount(ctx context.Context, instructorID uuid.UUID) (int64, error) {
	count, err := s.store.Instructor.GetStudentsTodayCount(ctx, instructorID)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (s *InstructorServices) GetAttendanceRateToday(ctx context.Context, instructorID uuid.UUID) (float64, error) {
	rate, err := s.store.Instructor.GetAttendanceRateToday(ctx, instructorID)
	if err != nil {
		return 0, err
	}
	return rate, nil
}
