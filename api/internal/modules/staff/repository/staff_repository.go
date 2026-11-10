package staffrepository

import (
	"context"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	staffdomain "github.com/vitalfit/api/internal/modules/staff/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type StaffStore struct {
	db *gorm.DB
}

func NewStaffStore(db *gorm.DB) *StaffStore {
	return &StaffStore{db: db}
}

func (s *StaffStore) AssignStaffToBranch(ctx context.Context, branchID uuid.UUID, staffID []uuid.UUID) error {
	var linksToCreate []staffdomain.BranchStaff
	for _, pid := range staffID {
		linksToCreate = append(linksToCreate, staffdomain.BranchStaff{
			BranchID: branchID,
			UserID:   pid,
		})
	}

	if len(linksToCreate) == 0 {
		return nil
	}

	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).
			Clauses(clause.OnConflict{DoNothing: true}).
			Create(&linksToCreate).Error; err != nil {
			return err
		}
		return nil
	})

	return err
}

func (s *StaffStore) ListBranchStaffByRole(ctx context.Context, branchID uuid.UUID, roleID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]authdomain.Users, int64, error) {
	var users []authdomain.Users
	var total int64

	query := s.db.WithContext(ctx).
		Model(&authdomain.Users{}).
		Joins("JOIN branch_staff ON branch_staff.user_id = users.user_id").
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Where("branch_staff.branch_id = ?", branchID)

	if roleID != uuid.Nil {
		query = query.Where("users.role_id = ?", roleID)
	}

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where(
			"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?",
			searchQuery, searchQuery, searchQuery, searchQuery,
		)
	}

	if fq.Role != "" {
		roleQuery := "%" + fq.Role + "%"
		query = query.Where("roles.name ILIKE ?", roleQuery)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Preload("Role").
		Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Find(&users).Error

	return users, total, err
}

func (s *StaffStore) RemoveStaffFromBranch(ctx context.Context, branchID uuid.UUID, staffID uuid.UUID) error {
	result := s.db.WithContext(ctx).
		Where("branch_id = ? AND user_id = ?", branchID, staffID).
		Delete(&staffdomain.BranchStaff{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}

	return nil
}

func (s *StaffStore) GetStaffBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error) {
	var branchStaff []staffdomain.BranchStaff
	err := s.db.WithContext(ctx).
		Preload("Branch").
		Where("user_id = ?", userID).
		Find(&branchStaff).Error

	branches := make([]branchdomain.Branch, 0, len(branchStaff))
	for _, bs := range branchStaff {
		branches = append(branches, bs.Branch)
	}
	return branches, err
}

func (s *StaffStore) GetUsersByIds(ctx context.Context, userIDs []uuid.UUID) ([]authdomain.Users, error) {
	var users []authdomain.Users
	err := s.db.WithContext(ctx).
		Preload("Role").
		Where("user_id IN ?", userIDs).
		Find(&users).Error
	return users, err
}

func (s *StaffStore) GetManagedBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error) {
	var branches []branchdomain.Branch
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Find(&branches).Error
	return branches, err
}

func (s *StaffStore) GetInstructorBranches(ctx context.Context, userID uuid.UUID) ([]branchdomain.Branch, error) {
	var instructor instructordomain.Instructor
	err := s.db.WithContext(ctx).
		Preload("Branches").
		Where("user_id = ?", userID).
		First(&instructor).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return []branchdomain.Branch{}, nil
		}
		return nil, err
	}

	return instructor.Branches, nil
}
