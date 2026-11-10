package staffdomain

import (
	"context"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	"github.com/vitalfit/api/pkg/pagination"
)

type StaffServiceInterface interface {
	AssignStaffToBranch(ctx context.Context, branchID uuid.UUID, staffID []uuid.UUID) error
	ListBranchStaffByRole(ctx context.Context, branchID uuid.UUID, roleID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]authdomain.Users, int64, error)
	RemoveStaffFromBranch(ctx context.Context, branchID uuid.UUID, staffID uuid.UUID) error
	GetStaffBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error)
	GetManagedBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error)
	GetInstructorBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error)
}
