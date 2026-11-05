package llmservices

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	bookingdomain "github.com/vitalfit/api/internal/modules/booking/domain"
	bookingservice "github.com/vitalfit/api/internal/modules/booking/services"
	routinedomain "github.com/vitalfit/api/internal/modules/routines/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

var tools = []openai.Tool{
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "get_all_branches",
			Description: "Obtiene la lista de todas las sucursales disponibles con sus IDs. Útil cuando el usuario quiere saber qué sucursales existen o para obtener el ID de una sucursal por su nombre.",
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
	},
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "get_available_classes",
			Description: "Obtiene las clases disponibles para una fecha y sucursal específica.",
			Parameters: jsonschema.Definition{
				Type: jsonschema.Object,
				Properties: map[string]jsonschema.Definition{
					"date": {
						Type:        jsonschema.String,
						Description: "La fecha para buscar clases en formato YYYY-MM-DD (ej. 2025-10-25). Si no se provee, se asume hoy.",
					},
					"branch_id": {
						Type:        jsonschema.String,
						Description: "El UUID de la sucursal para consultar el horario.",
					},
				},
			},
		},
	},
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "book_class",
			Description: "Reserva una clase específica para el usuario usando el ID de la clase.",
			Parameters: jsonschema.Definition{
				Type: jsonschema.Object,
				Properties: map[string]jsonschema.Definition{
					"class_id": {
						Type:        jsonschema.String,
						Description: "El UUID de la clase que se desea reservar.",
					},
				},
				Required: []string{"class_id"},
			},
		},
	},
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "get_my_bookings",
			Description: "Obtiene la lista de reservas activas del usuario. Útil para ver qué tiene reservado o para buscar el ID de una reserva para cancelar.",
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
	},
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "cancel_booking",
			Description: "Cancela una reserva existente usando el ID de la reserva.",
			Parameters: jsonschema.Definition{
				Type: jsonschema.Object,
				Properties: map[string]jsonschema.Definition{
					"booking_id": {
						Type:        jsonschema.String,
						Description: "El UUID de la reserva que se desea cancelar.",
					},
				},
				Required: []string{"booking_id"},
			},
		},
	},
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "create_and_assign_routine",
			Description: "Crea una nueva rutina personalizada basada en el objetivo del usuario (perder peso, definir, etc.) y se la asigna inmediatamente.",
			Parameters: jsonschema.Definition{
				Type: jsonschema.Object,
				Properties: map[string]jsonschema.Definition{
					"name": {
						Type:        jsonschema.String,
						Description: "Nombre creativo para la rutina (ej. 'Destrucción de Grasa 3000').",
					},
					"description": {
						Type:        jsonschema.String,
						Description: "Descripción breve del objetivo de la rutina.",
					},
					"level": {
						Type:        jsonschema.String,
						Enum:        []string{"Beginner", "Intermediate", "Advanced"},
						Description: "Nivel de dificultad de la rutina.",
					},
					"exercises": {
						Type:        jsonschema.Array,
						Description: "Lista de ejercicios que componen la rutina.",
						Items: &jsonschema.Definition{
							Type: jsonschema.Object,
							Properties: map[string]jsonschema.Definition{
								"name": {
									Type:        jsonschema.String,
									Description: "Nombre del ejercicio (ej. 'Sentadillas').",
								},
								"sets": {
									Type: jsonschema.Integer,
								},
								"reps": {
									Type:        jsonschema.String,
									Description: "Repeticiones (ej. '12' o '12-15').",
								},
								"muscle_group": {
									Type:        jsonschema.String,
									Enum:        []string{"Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "FullBody", "Other"},
									Description: "Grupo muscular principal.",
								},
							},
							Required: []string{"name", "sets", "reps"},
						},
					},
					"service_id": {
						Type:        jsonschema.String,
						Description: "El UUID del servicio asociado a esta rutina (opcional).",
					},
				},
				Required: []string{"name", "level", "exercises"},
			},
		},
	},
}

func (s *LLMService) callFunction(ctx context.Context, userID uuid.UUID, name string, argsRaw string) (string, error) {
	s.logger.Infow(" Ejecutando Tool", "name", name, "args", argsRaw)

	switch name {
	case "get_all_branches":
		branches, err := s.store.Branches.GetAllBranches(ctx)
		if err != nil {
			return "Error obteniendo sucursales.", nil
		}
		var sb strings.Builder
		sb.WriteString("Sucursales disponibles:\n")
		for _, b := range branches {
			sb.WriteString(fmt.Sprintf("- %s (ID: %s)\n", b.Name, b.BranchID))
		}
		return sb.String(), nil

	case "get_available_classes":
		var args struct {
			Date     string `json:"date"`
			BranchID string `json:"branch_id"`
		}
		if err := json.Unmarshal([]byte(argsRaw), &args); err != nil {
			return "Error: Argumentos JSON inválidos para obtener clases.", nil
		}

		targetDate := time.Now()
		if args.Date != "" {
			parsed, err := time.Parse("2006-01-02", args.Date)
			if err == nil {
				targetDate = parsed
			}
		}

		startOfDay := time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, targetDate.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)

		if args.BranchID == "" {
			return "SYSTEM_REQUIREMENT: Branch ID is missing. YOU MUST call 'get_all_branches' first to find the ID corresponding to the user's requested location name (e.g., 'Madrid'), then call 'get_available_classes' again with that ID.", nil
		}

		branchID, err := uuid.Parse(args.BranchID)
		if err != nil {
			return "Error: ID de sucursal inválido. Por favor usa 'get_all_branches' para obtener un ID válido.", nil
		}

		classes, err := s.store.Schedule.GetUpcomingClassesByBranch(ctx, branchID, &startOfDay, &endOfDay)
		if err != nil {
			s.logger.Errorw("Error buscando clases", "err", err)
			return "Error interno consultando el horario. Intenta más tarde.", nil
		}

		if len(classes) == 0 {
			return fmt.Sprintf("No encontré clases programadas para el %s.", targetDate.Format("2006-01-02")), nil
		}

		var result strings.Builder
		result.WriteString(fmt.Sprintf("SYSTEM NOTE: The user sees a numbered list. You MUST map the user's selection (e.g., '1') to the corresponding UUID provided in brackets [ID:...] when calling tools. Available classes for %s:\n", targetDate.Format("2006-01-02")))

		count := 0
		for _, c := range classes {
			if c.StartsAt.Before(time.Now()) {
				continue
			}
			count++

			instructorName := "Instructor"
			if c.Instructor.User != nil {
				instructorName = c.Instructor.User.FirstName
			}
			serviceName := "Clase"
			if c.Service.Name != "" {
				serviceName = c.Service.Name
			}

			bookedCount, err := s.store.Booking.CountBookingsForClass(ctx, c.ClassID)
			if err != nil {
				s.logger.Errorw("Error counting bookings", "class_id", c.ClassID, "err", err)
			}
			availableSpots := int64(c.MaxCapacity) - bookedCount
			if availableSpots < 0 {
				availableSpots = 0
			}

			result.WriteString(fmt.Sprintf("%d. [ID:%s] %s | %s | Instructor: %s (Cupos: %d)\n",
				count, c.ClassID, serviceName, c.StartsAt.Format("15:04"), instructorName, availableSpots))
		}

		if count == 0 {
			return fmt.Sprintf("Ya no quedan clases disponibles para el %s (han finalizado o ya comenzaron).", targetDate.Format("2006-01-02")), nil
		}

		return result.String(), nil

	case "book_class":
		var args struct {
			ClassID string `json:"class_id"`
		}
		if err := json.Unmarshal([]byte(argsRaw), &args); err != nil {
			return "Error: Argumentos inválidos.", nil
		}

		classID, err := uuid.Parse(args.ClassID)
		if err != nil {
			return fmt.Sprintf("Error: '%s' is not a valid UUID. You sent the list number instead of the UUID. Please retrieve the UUID corresponding to item #%s from the available classes list and try again.", args.ClassID, args.ClassID), nil
		}

		class, err := s.store.Schedule.GetClassByID(ctx, classID)
		if err != nil {
			return "Error: No se encontró la clase especificada.", nil
		}

		if class.StartsAt.Before(time.Now()) {
			return "Error: No puedes reservar una clase que ya ha comenzado o finalizado.", nil
		}

		bookedCount, _ := s.store.Booking.CountBookingsForClass(ctx, classID)
		if class.MaxCapacity > 0 && bookedCount >= int64(class.MaxCapacity) {
			return "Error: La clase está llena. No quedan cupos disponibles.", nil
		}

		// Validaciones de Membresía y Saldo (Replicando lógica de BookingService)
		isMember, err := s.store.Membership.ClientHasActiveMembership(ctx, userID, 0)
		if err != nil {
			s.logger.Errorw("Error checking membership", "error", err)
			isMember = false
		}

		canBook := false

		if isMember {
			branchService, err := s.store.Products.GetBranchServiceByID(ctx, class.BranchID, class.ServiceID)
			if err != nil {
				s.logger.Errorw("Error getting branch service details", "error", err)
			} else {
				if branchService.PriceForMember == 0 {
					canBook = true
				}
			}
		}

		if !canBook {
			clientBalance, err := s.store.Products.GetClientBalance(ctx, userID, class.ServiceID)
			if err != nil && !errors.Is(err, shared_errors.ErrNotFound) {
				return "Error consultando saldo de créditos.", nil
			}

			if clientBalance != nil && clientBalance.Balance > 0 {
				if err := s.store.Products.SpendClientBalance(ctx, userID, class.ServiceID); err != nil {
					return "Error procesando el consumo del crédito.", nil
				}
				canBook = true
			}
		}

		if !canBook {
			return "No se pudo completar la reserva: No tienes una membresía activa que cubra esta clase ni créditos suficientes.", nil
		}

		booking := &bookingdomain.Booking{
			UserID:    userID,
			ClassID:   classID,
			Status:    bookingdomain.BookingStatusConfirmed,
			CreatedAt: time.Now(),
		}

		if _, err := s.store.Booking.CreateBooking(ctx, booking); err != nil {
			return fmt.Sprintf("No se pudo completar la reserva. Motivo: %v", err), nil
		}

		return "¡Reserva confirmada con éxito! Se ha añadido a tu calendario.", nil

	case "get_my_bookings":
		now := time.Now()
		bookings, err := s.store.Booking.GetClientBookings(ctx, userID, &now, nil)
		if err != nil {
			return "Error obteniendo tus reservas.", nil
		}

		if len(bookings) == 0 {
			return "No tienes ninguna reserva futura en este momento.", nil
		}

		upcoming := bookings
		if len(upcoming) > 10 {
			upcoming = upcoming[:10]
		}

		var result strings.Builder
		result.WriteString("Tus próximas reservas son:\n")
		for _, b := range upcoming {
			result.WriteString(fmt.Sprintf("- [ID:%s] %s con %s - %s (%s)\n", b.BookingID, b.ServiceName, b.Instructor, b.StartsAt.Format("Mon, 02 Jan 15:04"), b.BranchName))
		}
		return result.String(), nil

	case "cancel_booking":
		var args struct {
			BookingID string `json:"booking_id"`
		}
		if err := json.Unmarshal([]byte(argsRaw), &args); err != nil {
			return "Error: Argumentos inválidos.", nil
		}
		bookingID, err := uuid.Parse(args.BookingID)
		if err != nil {
			return fmt.Sprintf("Error: '%s' is not a valid UUID. You sent the list number instead of the UUID. Please retrieve the UUID corresponding to the booking from the list and try again.", args.BookingID), nil
		}

		// Reuse the booking service so ownership, cancellation window and
		// balance refunds follow the same rules as the REST endpoint.
		if err := bookingservice.NewBookingService(s.store).CancelBooking(ctx, bookingID, &userID); err != nil {
			return fmt.Sprintf("No se pudo cancelar la reserva. Error: %v", err), nil
		}
		return "Reserva cancelada correctamente.", nil

	case "create_and_assign_routine":
		var args struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Level       string `json:"level"`
			Exercises   []struct {
				Name        string `json:"name"`
				Sets        int    `json:"sets"`
				Reps        string `json:"reps"`
				MuscleGroup string `json:"muscle_group"`
			} `json:"exercises"`
			ServiceID string `json:"service_id,omitempty"`
		}
		if err := json.Unmarshal([]byte(argsRaw), &args); err != nil {
			return "Error: Argumentos de rutina inválidos.", nil
		}

		s.logger.Infow("🏋️ IA Creando Rutina", "nombre", args.Name, "ejercicios", len(args.Exercises))

		var serviceID *uuid.UUID
		if args.ServiceID != "" {
			if id, err := uuid.Parse(args.ServiceID); err == nil {
				serviceID = &id
			}
		}

		routine := &routinedomain.Routine{
			RoutineID:   uuid.New(),
			Name:        args.Name,
			Description: args.Description,
			Level:       routinedomain.RoutineLevel(args.Level),
			ServiceID:   serviceID,
			CreatorID:   &userID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		var routineExercises []routinedomain.RoutineExercise

		for i, exData := range args.Exercises {
			fq := pagination.PaginatedFeedQuery{Search: exData.Name, Limit: 1}
			existingExs, _, _ := s.store.Routine.GetExercises(ctx, fq)

			var exerciseID uuid.UUID

			if len(existingExs) > 0 {
				exerciseID = existingExs[0].ExerciseID
			} else {
				newEx := &routinedomain.Exercise{
					ExerciseID:  uuid.New(),
					Name:        exData.Name,
					Description: "Generado por VitalBot",
					MuscleGroup: routinedomain.MuscleGroup(exData.MuscleGroup),
					VideoURL:    fmt.Sprintf("https://www.youtube.com/results?search_query=%s", url.QueryEscape(exData.Name)),
				}
				if err := s.store.Routine.CreateExercise(ctx, newEx); err != nil {
					s.logger.Errorw("Fallo creando ejercicio IA", "name", exData.Name, "err", err)
					continue
				}
				exerciseID = newEx.ExerciseID
			}

			routineExercises = append(routineExercises, routinedomain.RoutineExercise{
				RoutineID:  routine.RoutineID,
				ExerciseID: exerciseID,
				Sets:       exData.Sets,
				Reps:       exData.Reps,
				Order:      i + 1,
				RestTime:   60,
			})
		}

		routine.RoutineExercises = routineExercises

		if err := s.store.Routine.CreateRoutine(ctx, routine); err != nil {
			return fmt.Sprintf("Hubo un error guardando la rutina generada: %v", err), nil
		}

		assignment := &routinedomain.UserRoutine{
			ClientID:     userID,
			RoutineID:    routine.RoutineID,
			Status:       routinedomain.StatusActive,
			AssignedDate: time.Now(),
			IsActive:     true,
		}

		if err := s.store.Routine.AssignRoutine(ctx, assignment); err != nil {
			return "Rutina creada, pero falló la asignación a tu perfil.", nil
		}

		return fmt.Sprintf("¡Éxito! He creado la rutina '%s' con %d ejercicios y te la he asignado. Ve a la sección 'Mi Plan' para verla.", routine.Name, len(routineExercises)), nil

	default:
		return fmt.Sprintf("Error: No sé cómo ejecutar la herramienta '%s'.", name), nil
	}
}
