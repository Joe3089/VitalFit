package instructorrepository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type InstructorStore struct {
	db *gorm.DB
}

func NewInstructorStore(db *gorm.DB) *InstructorStore {
	return &InstructorStore{db: db}
}

func (s *InstructorStore) Create(ctx context.Context, tx *gorm.DB, instructor *instructordomain.Instructor) error {

	if err := tx.WithContext(ctx).Create(&instructor.User).Error; err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return shared_errors.ErrConflict
		}
		return err
	}

	instructor.UserID = instructor.User.UserID

	if err := tx.WithContext(ctx).Omit("User").Create(instructor).Error; err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return shared_errors.ErrConflict
		}
		return err
	}
	return nil
}

func (s *InstructorStore) GetInstructors(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*instructordomain.Instructor, error) {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	var instructors []*instructordomain.Instructor

	query := s.db.WithContext(ctx).
		Joins("JOIN users ON users.user_id = instructors.user_id").
		Preload("User").
		Preload("Specialties")

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

	err := query.Limit(fq.Limit).Offset(fq.Page*fq.Limit - fq.Limit).Order("instructors.created_at " + fq.Sort).Find(&instructors).Error
	if err != nil {
		return nil, err
	}

	return instructors, nil
}

func (s *InstructorStore) GetSummary(ctx context.Context) (*instructordomain.InstructorSummary, error) {
	var summary instructordomain.InstructorSummary

	query := s.db.WithContext(ctx).
		Model(&instructordomain.Instructor{}).
		Joins("JOIN users ON users.user_id = instructors.user_id")

	err := query.Select(
		"COUNT(instructors.instructor_id) as total",
		"COUNT(CASE WHEN users.status = 'Active' THEN 1 END) as actives",
		"COUNT(CASE WHEN users.status = 'Blocked' THEN 1 END) as blocked",
	).Take(&summary).Error

	if err != nil {
		return nil, err
	}

	return &summary, nil
}

func (s *InstructorStore) GetInstructorsFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	var count int64
	query := s.db.WithContext(ctx).Model(&instructordomain.Instructor{}).
		Joins("JOIN users ON users.user_id = instructors.user_id").
		Preload("User").
		Preload("Specialties")

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

	err := query.Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (s *InstructorStore) Delete(ctx context.Context, instructorID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		var instructor instructordomain.Instructor
		if err := tx.WithContext(ctx).Where("instructor_id = ?", instructorID).First(&instructor).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared_errors.ErrNotFound
			}
			return err
		}

		if err := tx.WithContext(ctx).Where("instructor_id = ?", instructorID).Delete(&scheduledomain.Class{}).Error; err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Where("instructor_id = ?", instructorID).Delete(&instructordomain.BranchInstructor{}).Error; err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Where("instructor_id = ?", instructorID).Delete(&instructordomain.InstructorSpecialty{}).Error; err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Delete(&instructordomain.Instructor{}, instructorID).Error; err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Delete(&authdomain.Users{}, instructor.UserID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil
			}
			return err
		}

		return nil
	})
}

func (s *InstructorStore) GetByID(ctx context.Context, instructorID uuid.UUID) (*instructordomain.Instructor, error) {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	var instructor *instructordomain.Instructor
	err := s.db.WithContext(ctx).Preload("User").Preload("Specialties").Where("instructor_id = ?", instructorID).First(&instructor).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return instructor, nil
}

func (s *InstructorStore) GetByUserID(ctx context.Context, userID uuid.UUID) (*instructordomain.Instructor, error) {
	var instructor instructordomain.Instructor
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).First(&instructor).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &instructor, nil
}

func (s *InstructorStore) Update(ctx context.Context, instructor *instructordomain.Instructor) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		var existingInstructor instructordomain.Instructor
		if err := tx.WithContext(ctx).Where("instructor_id = ?", instructor.InstructorID).First(&existingInstructor).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return shared_errors.ErrNotFound
			}
			return err
		}
		userUpdates := make(map[string]interface{})
		if instructor.User.FirstName != "" {
			userUpdates["first_name"] = instructor.User.FirstName
		}
		if instructor.User.LastName != "" {
			userUpdates["last_name"] = instructor.User.LastName
		}
		if instructor.User.Email != "" {
			userUpdates["email"] = instructor.User.Email
		}
		if instructor.User.Phone != "" {
			userUpdates["phone"] = instructor.User.Phone
		}
		if instructor.User.Gender != "" {
			userUpdates["gender"] = instructor.User.Gender
		}
		if !instructor.User.BirthDate.IsZero() {
			userUpdates["birth_date"] = instructor.User.BirthDate
		}
		if instructor.User.ProfilePictureURL != "" {
			userUpdates["profile_picture_url"] = instructor.User.ProfilePictureURL
		}

		if len(userUpdates) > 0 {
			userID := existingInstructor.UserID

			if err := tx.WithContext(ctx).Model(&authdomain.Users{}).Where("user_id = ?", userID).Updates(userUpdates).Error; err != nil {
				return err
			}
		}

		if err := tx.WithContext(ctx).Model(instructor).Omit("User").Updates(instructor).Error; err != nil {
			return err
		}
		return nil
	})
}

func (s *InstructorStore) CreateAndInvitate(ctx context.Context, instructor *instructordomain.Instructor, token string, invitationExp time.Duration) error {
	//transacction
	return db.WithTX(s.db, func(tx *gorm.DB) error {

		if err := s.Create(ctx, tx, instructor); err != nil {
			return err //rollback
		}

		if err := s.createUserInvitation(ctx, tx, token, instructor.UserID, invitationExp); err != nil {
			return err //rollback
		}

		return nil //commit
	})
}

func (s *InstructorStore) createUserInvitation(ctx context.Context, tx *gorm.DB, code string, userID uuid.UUID, invitationExp time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	return tx.WithContext(ctx).Create(&authdomain.UserInvitations{
		Token:  code,
		UserID: userID,
		Expiry: time.Now().Add(invitationExp),
	}).Error
}

func (s *InstructorStore) AssignInstructorSpecialtyTx(ctx context.Context, tx *gorm.DB, instructorID uuid.UUID, specialityID []uuid.UUID) error {
	var linksToCreate []instructordomain.InstructorSpecialty
	for _, pid := range specialityID {
		linksToCreate = append(linksToCreate, instructordomain.InstructorSpecialty{
			InstructorID: instructorID,
			CategoryID:   pid,
		})
	}
	if len(linksToCreate) == 0 {
		return nil
	}
	err := tx.WithContext(ctx).
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&linksToCreate).Error
	if err != nil {
		switch err {
		case shared_errors.ErrConflict:
			return shared_errors.ErrConflict
		case shared_errors.ErrNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

func (s *InstructorStore) AssignInstructorSpecialty(ctx context.Context, instructorID uuid.UUID, specialityID []uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		return s.AssignInstructorSpecialtyTx(ctx, tx, instructorID, specialityID)
	})
}
func (s *InstructorStore) DeleteInstructorSpecialty(ctx context.Context, instructorID uuid.UUID, specialtyID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		result := tx.WithContext(ctx).
			Where("instructor_id = ? AND category_id = ?", instructorID, specialtyID).
			Delete(&instructordomain.InstructorSpecialty{})

		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return shared_errors.ErrNotFound
		}

		return nil
	})
}

func (s *InstructorStore) GetAllInstructors(ctx context.Context) ([]*instructordomain.Instructor, error) {
	var instructors []*instructordomain.Instructor
	err := s.db.WithContext(ctx).
		Find(&instructors).Error
	if err != nil {
		return nil, err
	}
	return instructors, nil
}

func (s *InstructorStore) GetAssignedClients(ctx context.Context, instructorID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*instructordomain.AssignedClient, error) {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	var clients []*instructordomain.AssignedClient

	query := `
		SELECT
			u.user_id,
			u.first_name,
			u.last_name,
			u.email,
			u.phone,
			u.profile_picture_url,
			COUNT(b.booking_id) as total_bookings
		FROM bookings b
		JOIN classes c ON b.class_id = c.class_id
		JOIN users u ON b.user_id = u.user_id
		WHERE c.instructor_id = ?
			AND b.status = 'Confirmed'
			AND b.deleted_at IS NULL
			AND c.deleted_at IS NULL
	`

	args := []interface{}{instructorID}

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query += ` AND (u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.email ILIKE ? OR CONCAT(u.first_name, ' ', u.last_name) ILIKE ?)`
		args = append(args, searchQuery, searchQuery, searchQuery, searchQuery)
	}

	query += ` GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture_url`
	query += ` ORDER BY total_bookings ` + fq.Sort
	query += ` LIMIT ? OFFSET ?`
	args = append(args, fq.Limit, (fq.Page-1)*fq.Limit)

	err := s.db.WithContext(ctx).Raw(query, args...).Scan(&clients).Error
	if err != nil {
		return nil, err
	}

	return clients, nil
}

func (s *InstructorStore) GetAssignedClientsTotal(ctx context.Context, instructorID uuid.UUID, fq pagination.PaginatedFeedQuery) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	var count int64

	query := `
		SELECT COUNT(DISTINCT u.user_id)
		FROM bookings b
		JOIN classes c ON b.class_id = c.class_id
		JOIN users u ON b.user_id = u.user_id
		WHERE c.instructor_id = ?
			AND b.status = 'Confirmed'
			AND b.deleted_at IS NULL
			AND c.deleted_at IS NULL
	`

	args := []interface{}{instructorID}

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query += ` AND (u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.email ILIKE ? OR CONCAT(u.first_name, ' ', u.last_name) ILIKE ?)`
		args = append(args, searchQuery, searchQuery, searchQuery, searchQuery)
	}

	err := s.db.WithContext(ctx).Raw(query, args...).Scan(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *InstructorStore) GetStudentsTodayCount(ctx context.Context, instructorID uuid.UUID) (int64, error) {
	var count int64
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1).Add(-time.Nanosecond)

	err := s.db.WithContext(ctx).Table("bookings b").
		Joins("JOIN classes c ON c.class_id = b.class_id").
		Where("c.instructor_id = ?", instructorID).
		Where("c.starts_at BETWEEN ? AND ?", startOfDay, endOfDay).
		Where("b.status = 'Confirmed'").
		Count(&count).Error

	return count, err
}

func (s *InstructorStore) GetAttendanceRateToday(ctx context.Context, instructorID uuid.UUID) (float64, error) {
	var totalBookings int64
	var attendedCount int64
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1).Add(-time.Nanosecond)

	err := s.db.WithContext(ctx).Table("bookings b").
		Joins("JOIN classes c ON c.class_id = b.class_id").
		Where("c.instructor_id = ?", instructorID).
		Where("c.starts_at BETWEEN ? AND ?", startOfDay, endOfDay).
		Where("b.status = 'Confirmed'").
		Count(&totalBookings).Error
	if err != nil {
		return 0, err
	}

	if totalBookings == 0 {
		return 0, nil
	}

	err = s.db.WithContext(ctx).Table("attendance_log al").
		Joins("JOIN classes c ON c.class_id = al.schedule_id").
		Where("c.instructor_id = ?", instructorID).
		Where("c.starts_at BETWEEN ? AND ?", startOfDay, endOfDay).
		Where("al.status = 'Attended'").
		Count(&attendedCount).Error
	if err != nil {
		return 0, err
	}

	return (float64(attendedCount) / float64(totalBookings)) * 100, nil
}
