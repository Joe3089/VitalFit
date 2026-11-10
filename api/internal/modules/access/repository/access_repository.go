package accessrepository

import (
	"context"

	"github.com/google/uuid"
	accessdomain "github.com/vitalfit/api/internal/modules/access/domain"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type AccessStore struct {
	db *gorm.DB
}

func NewAccessStore(db *gorm.DB) *AccessStore {
	return &AccessStore{
		db: db,
	}
}

func (r *AccessStore) LogAttendance(ctx context.Context, attendance *accessdomain.AttendanceLog) error {
	return r.db.WithContext(ctx).Create(attendance).Error
}

func (r *AccessStore) UpdateLogAttendance(ctx context.Context, attendance *accessdomain.AttendanceLog) error {
	return r.db.WithContext(ctx).Save(attendance).Error
}

func (r *AccessStore) GetClassAttendanceHistory(ctx context.Context, classID uuid.UUID, startDate, endDate, status *string) ([]*accessdomain.AttendanceLog, error) {
	var attendances []*accessdomain.AttendanceLog

	query := r.db.WithContext(ctx).
		Model(&accessdomain.AttendanceLog{}).
		Preload("User").
		Preload("Service").
		Preload("Class").
		Where("schedule_id = ?", classID)

	// Apply date filters
	if startDate != nil {
		query = query.Where("check_in_time >= ?", startDate)
	}
	if endDate != nil {
		query = query.Where("check_in_time <= ?", endDate)
	}

	// Apply status filter
	if status != nil {
		query = query.Where("status = ?", status)
	}

	// Order by check-in time descending (most recent first)
	query = query.Order("check_in_time DESC")

	err := query.Find(&attendances).Error
	if err != nil {
		return nil, err
	}

	return attendances, nil
}

func (r *AccessStore) GetClientAttendanceHistory(ctx context.Context, clientID uuid.UUID, startDate, endDate *string, fq pagination.PaginatedFeedQuery) ([]*accessdomain.AttendanceLog, int64, error) {
	var attendances []*accessdomain.AttendanceLog
	var total int64

	query := r.db.WithContext(ctx).
		Model(&accessdomain.AttendanceLog{}).
		Where("user_id = ?", clientID)

	// Apply date filters
	if startDate != nil {
		query = query.Where("check_in_time >= ?", startDate)
	}
	if endDate != nil {
		query = query.Where("check_in_time <= ?", endDate)
	}

	// Get total count before pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (fq.Page - 1) * fq.Limit
	query = query.
		Preload("User").
		Preload("Service").
		Preload("Class").
		Order("check_in_time DESC").
		Limit(fq.Limit).
		Offset(offset)

	err := query.Find(&attendances).Error
	if err != nil {
		return nil, 0, err
	}

	return attendances, total, nil
}

func (r *AccessStore) GetClientServiceUsage(ctx context.Context, clientID uuid.UUID, startDate, endDate *string, fq pagination.PaginatedFeedQuery) ([]*accessdomain.AttendanceLog, int64, error) {
	var serviceUsage []*accessdomain.AttendanceLog
	var total int64

	query := r.db.WithContext(ctx).
		Model(&accessdomain.AttendanceLog{}).
		Where("user_id = ?", clientID)

	// Apply date filters
	if startDate != nil {
		query = query.Where("check_in_time >= ?", startDate)
	}
	if endDate != nil {
		query = query.Where("check_in_time <= ?", endDate)
	}

	// Get total count before pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (fq.Page - 1) * fq.Limit
	query = query.
		Preload("Service").
		Preload("Class").
		Preload("Class.Branch").
		Order("check_in_time DESC").
		Limit(fq.Limit).
		Offset(offset)

	err := query.Find(&serviceUsage).Error
	if err != nil {
		return nil, 0, err
	}

	return serviceUsage, total, nil
}

func (r *AccessStore) GetAttendanceCounts(ctx context.Context) ([]accessdomain.ClientScore, error) {
	var results []accessdomain.ClientScore
	err := r.db.WithContext(ctx).
		Model(&accessdomain.AttendanceLog{}).
		Select("user_id, count(*) as attendance_count").
		Group("user_id").
		Scan(&results).Error

	return results, err
}

func (r *AccessStore) UpdateClientScore(ctx context.Context, userID uuid.UUID, score int) error {
	return r.db.WithContext(ctx).
		Model(&authdomain.ClientProfiles{}).
		Where("user_id = ?", userID).
		Update("scoring", score).Error
}
