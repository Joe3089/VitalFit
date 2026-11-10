package instructorrepository

import (
	"context"

	"github.com/google/uuid"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (s *InstructorStore) AssignInstructorsToBranch(ctx context.Context, branchID uuid.UUID, instructorID []uuid.UUID) error {
	var linksToCreate []instructordomain.BranchInstructor
	for _, pid := range instructorID {
		linksToCreate = append(linksToCreate, instructordomain.BranchInstructor{
			BranchID:     branchID,
			InstructorID: pid,
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
func (s *InstructorStore) ListBranchInstructors(ctx context.Context, branchID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*instructordomain.Instructor, error) {
	var instructors []*instructordomain.Instructor

	query := s.db.WithContext(ctx).
		Preload("User").
		Joins("JOIN branch_instructors ON branch_instructors.instructor_id = instructors.instructor_id").
		Joins("JOIN users ON users.user_id = instructors.user_id").
		Where("branch_instructors.branch_id = ?", branchID).
		Where("instructors.deleted_at IS NULL")

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where(
			"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?",
			searchQuery, searchQuery, searchQuery, searchQuery,
		)
	}

	if fq.Identity_doc != "" {
		idQuery := "%" + fq.Identity_doc + "%"
		query = query.Where("users.identity_document ILIKE ?", idQuery)
	}

	err := query.Find(&instructors).Error
	if err != nil {
		return nil, err
	}

	return instructors, nil
}

func (s *InstructorStore) RemoveInstructorFromBranch(ctx context.Context, branchID uuid.UUID, instructorID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).
			Where("branch_id = ? AND instructor_id = ?", branchID, instructorID).
			Delete(&scheduledomain.Class{}).Error; err != nil {
			return err
		}

		association := instructordomain.BranchInstructor{
			BranchID:     branchID,
			InstructorID: instructorID,
		}

		result := tx.WithContext(ctx).Delete(&association)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}
