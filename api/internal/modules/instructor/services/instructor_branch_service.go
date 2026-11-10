package instructorservices

import (
	"context"

	"github.com/google/uuid"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	"github.com/vitalfit/api/pkg/pagination"
)

func (s *InstructorServices) AssignInstructorsToBranch(ctx context.Context, branchID uuid.UUID, instructorID []uuid.UUID) error {
	err := s.store.Instructor.AssignInstructorsToBranch(ctx, branchID, instructorID)
	if err != nil {
		return err
	}
	return nil

}

func (s *InstructorServices) ListBranchInstructors(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*instructordomain.Instructor, error) {
	instructors, err := s.store.Instructor.ListBranchInstructors(ctx, branchID, fq)
	if err != nil {
		return nil, err
	}
	return instructors, nil
}

func (s *InstructorServices) RemoveInstructorFromBranch(ctx context.Context, branchID uuid.UUID, instructorID uuid.UUID) error {
	err := s.store.Instructor.RemoveInstructorFromBranch(ctx, branchID, instructorID)
	if err != nil {
		return err
	}
	return nil
}
