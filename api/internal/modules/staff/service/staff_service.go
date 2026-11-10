package staffservice

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type StaffService struct {
	store store.Storage
}

func NewStaffService(store store.Storage) *StaffService {
	return &StaffService{store: store}
}

func (s *StaffService) AssignStaffToBranch(ctx context.Context, branchID uuid.UUID, staffID []uuid.UUID) error {
	if len(staffID) == 0 {
		return nil
	}

	users, err := s.store.Staff.GetUsersByIds(ctx, staffID)
	if err != nil {
		return err
	}

	for _, user := range users {
		if user.Role.Name == "receptionist" {
			existingBranches, err := s.store.Staff.GetStaffBranches(ctx, user.UserID)
			if err != nil {
				return err
			}
			for _, b := range existingBranches {
				if b.BranchID != branchID {
					return fmt.Errorf("the user %s %s is a recepcionist and cannot be assigned to another branch %s", user.FirstName, user.LastName, b.Name)
				}
			}
		}
	}

	return s.store.Staff.AssignStaffToBranch(ctx, branchID, staffID)
}

func (s *StaffService) ListBranchStaffByRole(ctx context.Context, branchID uuid.UUID, roleID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]authdomain.Users, int64, error) {
	return s.store.Staff.ListBranchStaffByRole(ctx, branchID, roleID, fq)
}

func (s *StaffService) RemoveStaffFromBranch(ctx context.Context, branchID uuid.UUID, staffID uuid.UUID) error {
	return s.store.Staff.RemoveStaffFromBranch(ctx, branchID, staffID)
}

func (s *StaffService) GetStaffBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error) {
	return s.store.Staff.GetStaffBranches(ctx, userID)
}

func (s *StaffService) GetManagedBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error) {
	return s.store.Staff.GetManagedBranches(ctx, userID)
}

func (s *StaffService) GetInstructorBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error) {
	return s.store.Staff.GetInstructorBranches(ctx, userID)
}
