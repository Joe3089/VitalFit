package bookingdomain

import (
	"context"
	"time"

	"github.com/google/uuid"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	"github.com/vitalfit/api/pkg/pagination"
)

type BookingServiceInterface interface {
	CreateBooking(ctx context.Context, userID uuid.UUID, classID uuid.UUID) (uuid.UUID, error)
	// CancelBooking cancels a confirmed booking. When requesterID is not nil the
	// booking must belong to that user (client self-service).
	CancelBooking(ctx context.Context, bookingID uuid.UUID, requesterID *uuid.UUID) error
	GetClientSchedule(ctx context.Context, branchID uuid.UUID, userID uuid.UUID, startDate, endDate *time.Time) ([]scheduledomain.Class, error)
	GetClientBookings(ctx context.Context, userID uuid.UUID, startDate, endDate *time.Time) ([]BookingWithClassInfo, error)
	GetClientActualBook(ctx context.Context, userID, branchID uuid.UUID, startsAt time.Time, endsAt time.Time) (*Booking, error)
	CanAccessService(ctx context.Context, userID, branchID, serviceID uuid.UUID) (bool, error)
	CountBookingsForClass(ctx context.Context, classID uuid.UUID) (int64, error)
	GetBookingsByClass(ctx context.Context, classID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*BookingWithUserInfo, int64, error)
	GetUpcomingClassReminders(ctx context.Context) ([]BookingReminder, error)
}
