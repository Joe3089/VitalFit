package instructordomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type InstructorServiceInterface interface {
	CreateInstructor(ctx context.Context, instructor *Instructor, token string) error
	GetInstructors(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Instructor, error)
	GetInstructorsFTotal(context.Context, pagination.PaginatedFeedQuery) (int64, error)
	GetSummary(context.Context) (*InstructorSummary, error)
	DeleteInstructor(ctx context.Context, instructorID uuid.UUID) error
	GetInstructorByID(ctx context.Context, instructorID uuid.UUID) (*Instructor, error)
	GetInstructorByUserID(ctx context.Context, userID uuid.UUID) (*Instructor, error)
	UpdateInstructor(ctx context.Context, instructor *Instructor) error

	AssignInstructorsToBranch(ctx context.Context, branchID uuid.UUID, instructorID []uuid.UUID) error
	ListBranchInstructors(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*Instructor, error)
	RemoveInstructorFromBranch(ctx context.Context, branchID uuid.UUID, instructorID uuid.UUID) error

	AssignInstructorSpecialty(ctx context.Context, instructorID uuid.UUID, specialties []uuid.UUID) error
	DeleteInstructorSpecialty(ctx context.Context, instructorID uuid.UUID, specialtyID uuid.UUID) error

	GetAssignedClients(ctx context.Context, instructorID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*AssignedClient, error)
	GetAssignedClientsTotal(ctx context.Context, instructorID uuid.UUID, fq pagination.PaginatedFeedQuery) (int64, error)

	GetStudentsTodayCount(ctx context.Context, instructorID uuid.UUID) (int64, error)
	GetAttendanceRateToday(ctx context.Context, instructorID uuid.UUID) (float64, error)
}
