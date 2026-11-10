package bookingrepository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	bookingdomain "github.com/vitalfit/api/internal/modules/booking/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BookingStore struct {
	db *gorm.DB
}

//
// ------------------------------------------------------------
// CreateBooking
// ------------------------------------------------------------
//

func NewBookingStore(db *gorm.DB) *BookingStore {
	return &BookingStore{db: db}
}

func (r *BookingStore) CreateBooking(ctx context.Context, booking *bookingdomain.Booking) (uuid.UUID, error) {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "class_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status", "updated_at", "deleted_at"}),
	}).Create(booking).Error; err != nil {
		return uuid.Nil, err
	}
	return booking.BookingID, nil
}

//
// ------------------------------------------------------------
// GetBookingByID
// ------------------------------------------------------------
//

func (r *BookingStore) GetBookingByID(ctx context.Context, bookingID uuid.UUID) (*bookingdomain.Booking, error) {
	var booking bookingdomain.Booking
	err := r.db.WithContext(ctx).
		Joins("Class").
		First(&booking, "booking_id = ?", bookingID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	return &booking, nil
}

//
// ------------------------------------------------------------
// CancelBooking
// ------------------------------------------------------------
//

func (s *BookingStore) CancelBooking(ctx context.Context, bookingID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		result := tx.WithContext(ctx).
			Model(&bookingdomain.Booking{}).
			Where("booking_id = ?", bookingID).
			Update("status", bookingdomain.BookingStatusCancelledByUser)

		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		return nil
	})
}

//
// ------------------------------------------------------------
// CancelBookingAndUpdateBalance
// ------------------------------------------------------------
//

func (s *BookingStore) CancelBookingAndUpdateBalance(ctx context.Context, booking *bookingdomain.Booking, shouldRefundBalance bool) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Only a confirmed booking can be cancelled; the conditional update makes
		// concurrent/double cancellations unable to refund the balance twice.
		result := tx.Model(&bookingdomain.Booking{}).
			Where("booking_id = ? AND status = ?", booking.BookingID, bookingdomain.BookingStatusConfirmed).
			Update("status", bookingdomain.BookingStatusCancelledByUser)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return shared_errors.ErrBookingNotActive
		}

		if shouldRefundBalance && booking.Class.ClassID != uuid.Nil {
			if err := tx.Model(&productsdomain.ClientServiceBalance{}).
				Where("user_id = ? AND service_id = ?", booking.UserID, booking.Class.ServiceID).
				Update("balance", gorm.Expr("balance + 1")).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

//
// ------------------------------------------------------------
// GetClientSchedule
// ------------------------------------------------------------
//

func (s *BookingStore) GetClientSchedule(
	ctx context.Context,
	branchID uuid.UUID,
	userID uuid.UUID,
	startDate, endDate *time.Time,
) ([]scheduledomain.Class, error) {
	var classes []scheduledomain.Class

	query := s.db.WithContext(ctx).Model(&scheduledomain.Class{}).
		Joins("JOIN bookings ON bookings.class_id = classes.class_id").
		Where("classes.branch_id = ?", branchID).
		Where("bookings.user_id = ?", userID).
		Where("bookings.status = ?", bookingdomain.BookingStatusConfirmed).
		Where("bookings.deleted_at IS NULL").
		Preload("Service").
		Preload("Instructor.User").
		Preload("Branch")

	if startDate != nil {
		query = query.Where("classes.starts_at >= ?", startDate)
	}
	if endDate != nil {
		query = query.Where("classes.starts_at <= ?", endDate)
	}

	err := query.Find(&classes).Error

	if err != nil {
		return nil, err
	}

	return classes, nil
}

func (s *BookingStore) CountBookingsForClass(ctx context.Context, classID uuid.UUID) (int64, error) {
	var count int64

	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		return tx.WithContext(ctx).
			Model(&bookingdomain.Booking{}).
			Where("class_id = ?", classID).
			Where("status = ?", bookingdomain.BookingStatusConfirmed).
			Where("deleted_at IS NULL").
			Count(&count).Error
	})

	if err != nil {
		return 0, err
	}

	return count, nil
}

//
// ------------------------------------------------------------
// GetBookingsByUser
// ------------------------------------------------------------
//

func (s *BookingStore) GetClientBookings(ctx context.Context, userID uuid.UUID, startDate, endDate *time.Time) ([]bookingdomain.BookingWithClassInfo, error) {
	var results []bookingdomain.BookingWithClassInfo
	args := []interface{}{userID, bookingdomain.BookingStatusCancelledByUser, bookingdomain.BookingStatusCancelledBySystem}

	queryStr := `
        SELECT 
            b.booking_id,
            c.class_id,
            c.starts_at,
            c.ends_at,
            s.name AS service_name,
            CONCAT(u.first_name, ' ', u.last_name) AS instructor,
            br.name AS branch_name
        FROM bookings b
        JOIN classes c ON b.class_id = c.class_id
        JOIN services s ON c.service_id = s.service_id
        JOIN instructors ins ON c.instructor_id = ins.instructor_id
        JOIN users u ON ins.user_id = u.user_id
        JOIN branch br ON c.branch_id = br.branch_id
        WHERE b.user_id = ? AND b.deleted_at IS NULL AND b.status NOT IN (?, ?)
    `

	if startDate != nil {
		queryStr += " AND c.starts_at >= ?"
		args = append(args, startDate)
	}
	if endDate != nil {
		queryStr += " AND c.starts_at <= ?"
		args = append(args, endDate)
	}

	queryStr += " ORDER BY c.starts_at ASC"

	err := s.db.WithContext(ctx).Raw(queryStr, args...).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	return results, nil
}

//
// ------------------------------------------------------------
// GetClientActualBook
// ------------------------------------------------------------
//

func (s *BookingStore) GetClientActualBook(ctx context.Context, userID, branchID uuid.UUID, startsAt time.Time, endsAt time.Time) (*bookingdomain.Booking, error) {
	var booking bookingdomain.Booking

	err := s.db.WithContext(ctx).
		Joins("JOIN classes ON bookings.class_id = classes.class_id").
		Where("bookings.user_id = ?", userID).
		Where("bookings.status = ?", bookingdomain.BookingStatusConfirmed).
		Where("classes.branch_id = ?", branchID).
		Where("classes.starts_at BETWEEN ? AND ?", startsAt, endsAt).
		First(&booking).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}

	return &booking, nil
}

//
// ------------------------------------------------------------
// GetBookingsByClass
// ------------------------------------------------------------
//

func (s *BookingStore) GetBookingsByClass(ctx context.Context, classID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*bookingdomain.BookingWithUserInfo, int64, error) {
	var bookings []*bookingdomain.BookingWithUserInfo
	var total int64

	baseQuery := s.db.WithContext(ctx).
		Table("bookings").
		Joins("JOIN users ON bookings.user_id = users.user_id").
		Where("bookings.class_id = ?", classID).
		Where("bookings.deleted_at IS NULL")

	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := baseQuery.Select("bookings.booking_id, bookings.user_id, users.first_name, users.last_name, users.email, users.phone, bookings.status, bookings.created_at").
		Limit(fq.Limit).
		Offset((fq.Page - 1) * fq.Limit).
		Order("bookings.created_at " + fq.Sort).
		Scan(&bookings).Error

	if err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

//
// ------------------------------------------------------------
// GetBookingsInTimeRange
// ------------------------------------------------------------
//

func (s *BookingStore) GetBookingsInTimeRange(ctx context.Context, startTime, endTime time.Time) ([]bookingdomain.BookingReminder, error) {
	var results []bookingdomain.BookingReminder

	query := `
		SELECT 
			b.booking_id,
			b.user_id,
			u.first_name,
			u.last_name,
			u.email,
			c.class_id,
			s.service_id,
			s.name AS service_name,
			c.starts_at
		FROM bookings b
		JOIN classes c ON b.class_id = c.class_id
		JOIN services s ON c.service_id = s.service_id
		JOIN users u ON b.user_id = u.user_id
		WHERE c.starts_at BETWEEN ? AND ?
		  AND b.status = ?
		  AND b.deleted_at IS NULL
	`

	err := s.db.WithContext(ctx).Raw(query, startTime, endTime, bookingdomain.BookingStatusConfirmed).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	return results, nil
}
