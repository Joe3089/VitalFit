package schedulehandlers

import (
	"time"

	"github.com/google/uuid"
	accessdomain "github.com/vitalfit/api/internal/modules/access/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
)

// --------------------
// REQUEST PAYLOADS
// --------------------

type CreateClassPayload struct {
	ServiceID       string    `json:"service_id" binding:"required"`
	InstructorID    string    `json:"instructor_id" binding:"required"`
	StartsAt        time.Time `json:"starts_at" binding:"required"`
	EndsAt          time.Time `json:"ends_at" binding:"required"`
	MaxCapacity     int       `json:"max_capacity" binding:"required,gte=1"`
	IsVisible       bool      `json:"is_visible"`
	Notes           string    `json:"notes"`
	Recurrence      string    `json:"recurrence" binding:"omitempty,oneof=daily weekly none"`
	RecurrenceUntil time.Time `json:"recurrence_until"`
}

func (p *CreateClassPayload) ToClass(branchID uuid.UUID) (*scheduledomain.Class, error) {

	serviceID, err := uuid.Parse(p.ServiceID)
	if err != nil {
		return nil, err
	}

	instructorID, err := uuid.Parse(p.InstructorID)
	if err != nil {
		return nil, err
	}

	class := &scheduledomain.Class{
		BranchID:     branchID,
		ServiceID:    serviceID,
		InstructorID: instructorID,
		StartsAt:     p.StartsAt,
		EndsAt:       p.EndsAt,
		MaxCapacity:  p.MaxCapacity,
		IsVisible:    p.IsVisible,
		Notes:        p.Notes,
	}

	return class, nil
}

type UpdateClassPayload struct {
	ServiceID    string     `json:"service_id"`
	InstructorID string     `json:"instructor_id"`
	StartsAt     *time.Time `json:"starts_at"`
	EndsAt       *time.Time `json:"ends_at"`
	MaxCapacity  *int       `json:"max_capacity"`
	IsVisible    *bool      `json:"is_visible"`
	Notes        *string    `json:"notes"`
}

func (p *UpdateClassPayload) ToClassUpdate(classID uuid.UUID) (*scheduledomain.Class, error) {

	class := &scheduledomain.Class{
		ClassID: classID,
	}

	if p.ServiceID != "" {
		id, err := uuid.Parse(p.ServiceID)
		if err != nil {
			return nil, err
		}
		class.ServiceID = id
	}

	if p.InstructorID != "" {
		id, err := uuid.Parse(p.InstructorID)
		if err != nil {
			return nil, err
		}
		class.InstructorID = id
	}

	if p.StartsAt != nil {
		class.StartsAt = *p.StartsAt
	}

	if p.EndsAt != nil {
		class.EndsAt = *p.EndsAt
	}

	if p.MaxCapacity != nil {
		class.MaxCapacity = *p.MaxCapacity
	}

	if p.IsVisible != nil {
		class.IsVisible = *p.IsVisible
	}

	if p.Notes != nil {
		class.Notes = *p.Notes
	}

	return class, nil
}

// --------------------
// RESPONSE PAYLOADS
// --------------------

type ClassResponse struct {
	ClassID      uuid.UUID `json:"class_id"`
	BranchID     uuid.UUID `json:"branch_id"`
	ServiceID    uuid.UUID `json:"service_id"`
	InstructorID uuid.UUID `json:"instructor_id"`

	StartsAt    time.Time `json:"starts_at"`
	EndsAt      time.Time `json:"ends_at"`
	MaxCapacity int       `json:"max_capacity"`
	IsVisible   bool      `json:"is_visible"`
	Notes       string    `json:"notes"`

	Status             string     `json:"status"`
	CancellationReason string     `json:"cancellation_reason,omitempty"`
	CancelledAt        *time.Time `json:"cancelled_at,omitempty"`
}

type AttendanceHistoryResponse struct {
	AttendanceID uuid.UUID                     `json:"attendance_id"`
	UserID       uuid.UUID                     `json:"user_id"`
	UserName     string                        `json:"user_name"`
	UserEmail    string                        `json:"user_email"`
	ServiceID    uuid.UUID                     `json:"service_id"`
	ServiceName  string                        `json:"service_name"`
	CheckInTime  time.Time                     `json:"check_in_time"`
	Status       accessdomain.AttendanceStatus `json:"status"`
}
