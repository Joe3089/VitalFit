package scheduledomain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ScheduleRepository define las operaciones de acceso a datos para las clases programadas.
type ScheduleRepository interface {

	// CreateClass crea una nueva clase programada.
	CreateClass(ctx context.Context, class *Class) error

	// CreateClasses crea múltiples clases programadas (para recurrencia).
	CreateClasses(ctx context.Context, classes []Class) error

	// GetClassesByBranch obtiene todas las clases programadas de una sucursal.
	GetClassesByBranch(ctx context.Context, branchID uuid.UUID, startDate, endDate *time.Time) ([]Class, error)

	// GetClassByID obtiene una clase programada específica por su ID.
	GetClassByID(ctx context.Context, classID uuid.UUID) (*Class, error)

	// UpdateClass actualiza los datos de una clase programada.
	UpdateClass(ctx context.Context, class *Class) error

	// DeleteClass elimina (o realiza soft-delete) una clase programada.
	DeleteClass(ctx context.Context, classID uuid.UUID) error

	// GetUpcomingClassesByBranch obtiene las clases futuras (o en curso) de una sucursal.
	GetUpcomingClassesByBranch(ctx context.Context, branchID uuid.UUID, startDate, endDate *time.Time) ([]Class, error)

	GetAvailableClassesForBranch(ctx context.Context, branchID uuid.UUID, startTime, endTime time.Time) ([]Class, error)

	// GetClassesByInstructor obtiene las clases programadas para un instructor específico (por UserID).
	GetClassesByInstructor(ctx context.Context, userID uuid.UUID, branchID *uuid.UUID, startDate, endDate *time.Time) ([]Class, error)

	// CancelClass marks the class as cancelled, cancels its confirmed bookings,
	// refunds consumed service credits and returns the affected client IDs.
	CancelClass(ctx context.Context, class *Class, reason string, cancelledBy uuid.UUID) ([]uuid.UUID, error)
}
