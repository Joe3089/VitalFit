package bookinghandlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// @Summary		Get client schedule for a branch
// @Description	Returns the available classes for a specific client in a specific branch. If the user is a client, it returns their own schedule. If staff, the user ID must be provided in the path.
// @Tags			Booking
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branchId	path		string	true	"Branch UUID"
// @Param			userId		path		string	false	"Client UUID (required for non-client users)"
// @Param			month		query		int		false	"Month (1-12)"
// @Param			year		query		int		false	"Year"
// @Param			date		query		string	false	"Specific date (YYYY-MM-DD)"
// @Success		200			{object}	object{data=[]scheduledomain.Class}
// @Failure		400			{object}	map[string]interface{}	"Bad Request (e.g., invalid UUID, missing userId for staff)"
// @Failure		500			{object}	map[string]interface{}	"Internal Server Error"
// @Router			/schedule/branch/{branchId}/client/{userId} [get]
func (h *BookingHandlers) GetClientScheduleHandler(c *gin.Context) {
	ctx := c.Request.Context()

	branchID, err := uuid.Parse(c.Param("branchId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid branchId format"))
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	var targetUserID uuid.UUID

	if user.Role.Name == "client" {
		targetUserID = user.UserID
	} else {
		permission := "booking:schedule:list"
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, permission)
			if err != nil {
				h.services.LogErrors.InternalServerError(c, err)
				return
			}
			if !ok {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
		}
		userIDStr := c.Param("userId")
		if userIDStr == "" {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required for non-client users"))
			return
		}
		targetUserID, err = uuid.Parse(userIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("invalid userId format"))
			return
		}
	}

	var startDate, endDate *time.Time
	monthStr := c.Query("month")
	yearStr := c.Query("year")
	dateStr := c.Query("date")

	if dateStr != "" {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			start := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, time.UTC)
			end := start.AddDate(0, 0, 1).Add(-time.Nanosecond)
			startDate = &start
			endDate = &end
		}
	} else if monthStr != "" && yearStr != "" {
		m, errM := strconv.Atoi(monthStr)
		y, errY := strconv.Atoi(yearStr)
		if errM == nil && errY == nil {
			start := time.Date(y, time.Month(m), 1, 0, 0, 0, 0, time.UTC)
			end := start.AddDate(0, 1, 0).Add(-time.Nanosecond)
			startDate = &start
			endDate = &end
		}
	}

	classes, err := h.services.BookingServices.GetClientSchedule(ctx, branchID, targetUserID, startDate, endDate)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": classes})
}

// @Summary		Book class
// @Description	Books a spot for a client in a class. If the user is a client, they book for themselves. If staff, the 'user_id' in the payload is required.
// @Tags			Booking
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			classId	path		string					true	"Class UUID"
// @Param			payload	body		BookUser				true	"User ID payload (only required for staff)"
// @Success		201		{object}	BookingCreatedResponse	"Booking created"
// @Failure		400		{object}	map[string]interface{}	"Bad Request"
// @Failure		409		{object}	map[string]interface{}	"Conflict"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/schedule/{classId}/book [post]
func (h *BookingHandlers) CreateBookingHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// Obtener class_id del path
	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload BookUser

	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	var targetUserID uuid.UUID

	if user.Role.Name == "client" {
		targetUserID = user.UserID
	} else {
		permission := "booking:create"
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, permission)
			if err != nil {
				h.services.LogErrors.InternalServerError(c, err)
				return
			}
			if !ok {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
		}
		// For staff, UserID is required in payload
		if payload.UserID == uuid.Nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required for non-client users"))
			return
		}
		targetUserID = payload.UserID
	}
	bookingID, err := h.services.BookingServices.CreateBooking(ctx, targetUserID, classID)
	if err != nil {
		switch {
		case errors.Is(err, shared_errors.ErrPayment):
			h.services.LogErrors.PaymentRequiredResponse(c)
		case errors.Is(err, shared_errors.ErrPastClass):
			h.services.LogErrors.BadRequestResponse(c, err)
		case errors.Is(err, shared_errors.ErrFullClass), errors.Is(err, shared_errors.ErrClassAlreadyCancelled):
			h.services.LogErrors.BadRequestResponse(c, err)
		case errors.Is(err, shared_errors.ErrNotFound):
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusCreated, BookingCreatedResponse{
		BookingID: bookingID,
		Message:   "Booking created successfully",
	})
}

// @Summary		Cancel booking
// @Description	Cancels an existing booking made by the client
// @Tags			Booking
// @Security		ApiKeyAuth
// @Produce		json
// @Param			bookingId	path		string						true	"Booking UUID"
// @Success		200			{object}	BookingCancelledResponse	"Booking cancelled"
// @Failure		400			{object}	map[string]interface{}		"Bad Request"
// @Failure		403			{object}	map[string]interface{}		"Forbidden"
// @Failure		500			{object}	map[string]interface{}		"Internal Server Error"
// @Router			/bookings/{bookingId}/cancel [patch]
func (h *BookingHandlers) CancelBookingHandler(c *gin.Context) {
	ctx := c.Request.Context()

	bookingID, err := uuid.Parse(c.Param("bookingId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	var requesterID *uuid.UUID
	if user.Role.Name == "client" {
		requesterID = &user.UserID
	} else {
		permission := "booking:cancel"
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, permission)
			if err != nil {
				h.services.LogErrors.InternalServerError(c, err)
				return
			}
			if !ok {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
		}
	}
	if err := h.services.BookingServices.CancelBooking(ctx, bookingID, requesterID); err != nil {
		switch {
		case errors.Is(err, shared_errors.ErrCancellationWindowClosed), errors.Is(err, shared_errors.ErrBookingNotActive):
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		case errors.Is(err, shared_errors.ErrNotFound):
			h.services.LogErrors.NotFoundResponse(c)
			return
		case errors.Is(err, shared_errors.ErrForbidden):
			h.services.LogErrors.ForbiddenResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, BookingCancelledResponse{
		Message: "Booking cancelled successfully",
	})
}

// @Summary		Get client bookings
// @Description	Returns all bookings for a specific client. If the user is a client, it returns their own bookings. If staff, the user ID must be provided in the path.
// @Tags			Booking
// @Security		ApiKeyAuth
// @Produce		json
// @Param			userId	path		string	false	"User UUID (required for staff)"
// @Param			month	query		int		false	"Month (1-12)"
// @Param			year	query		int		false	"Year"
// @Param			date	query		string	false	"Specific date (YYYY-MM-DD)"
// @Success		200		{object}	object{data=[]BookingResponse}
// @Failure		400		{object}	map[string]interface{}	"Bad Request (e.g., invalid UUID, missing userId for staff)"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/bookings/client/{userId} [get]
func (h *BookingHandlers) GetClientBookingsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	var targetUserID uuid.UUID
	var err error

	if user.Role.Name == "client" {
		targetUserID = user.UserID
	} else {
		permission := "booking:list"
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, permission)
			if err != nil {
				h.services.LogErrors.InternalServerError(c, err)
				return
			}
			if !ok {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
		}
		userIDStr := c.Param("userId")
		if userIDStr == "" {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required for non-client users"))
			return
		}
		targetUserID, err = uuid.Parse(userIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("invalid userId format"))
			return
		}
	}

	var startDate, endDate *time.Time
	monthStr := c.Query("month")
	yearStr := c.Query("year")
	dateStr := c.Query("date")

	if dateStr != "" {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			start := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, time.UTC)
			end := start.AddDate(0, 0, 1).Add(-time.Nanosecond)
			startDate = &start
			endDate = &end
		}
	} else if monthStr != "" && yearStr != "" {
		m, errM := strconv.Atoi(monthStr)
		y, errY := strconv.Atoi(yearStr)
		if errM == nil && errY == nil {
			start := time.Date(y, time.Month(m), 1, 0, 0, 0, 0, time.UTC)
			end := start.AddDate(0, 1, 0).Add(-time.Nanosecond)
			startDate = &start
			endDate = &end
		}
	}

	bookings, err := h.services.BookingServices.GetClientBookings(ctx, targetUserID, startDate, endDate)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": bookings,
	})
}

// @Summary		Get class bookings count
// @Description	Returns the total number of bookings for a specific class.
// @Tags			Booking
// @Security		ApiKeyAuth
// @Produce		json
// @Param			classId	path		string					true	"Class UUID"
// @Success		200		{object}	map[string]interface{}	"Count returned"
// @Failure		400		{object}	map[string]interface{}	"Bad Request"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/schedule/{classId}/bookings/count [get]
func (h *BookingHandlers) GetClassBookingsCountHandler(c *gin.Context) {
	ctx := c.Request.Context()
	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid classId format"))
		return
	}
	count, err := h.services.BookingServices.CountBookingsForClass(ctx, classID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

// @Summary		Get bookings for a class
// @Description	Returns all bookings for a specific class with client information
// @Tags			Booking
// @Security		ApiKeyAuth
// @Produce		json
// @Param			classId	path		string										true	"Class UUID"
// @Param			limit	query		int											false	"Number of results per page"	default(10)
// @Param			page	query		int											false	"Page number for pagination"	default(1)
// @Param			sort	query		string										false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Success		200		{object}	object{data=[]BookingWithUserInfoResponse}	"Bookings list"
// @Failure		400		{object}	map[string]interface{}						"Bad Request"
// @Failure		500		{object}	map[string]interface{}						"Internal Server Error"
// @Router			/bookings/class/{classId} [get]
func (h *BookingHandlers) GetBookingsByClassHandler(c *gin.Context) {
	ctx := c.Request.Context()

	fq := pagination.PaginatedFeedQuery{
		Limit: 10,
		Page:  1,
		Sort:  "asc", // Default to ASC for bookings (oldest first usually)
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid classId format"))
		return
	}

	nextURL := fmt.Sprintf("/bookings/class/%s?limit=%d&page=%d&sort=%s", classID, fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/bookings/class/%s?limit=%d&page=%d&sort=%s", classID, fq.Limit, previousPage, fq.Sort)

	bookings, total, err := h.services.BookingServices.GetBookingsByClass(ctx, classID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]*BookingWithUserInfoResponse, 0, len(bookings))
	for _, booking := range bookings {
		response = append(response, &BookingWithUserInfoResponse{
			BookingID: booking.BookingID,
			UserID:    booking.UserID,
			FirstName: booking.FirstName,
			LastName:  booking.LastName,
			Email:     booking.Email,
			Phone:     booking.Phone,
			Status:    booking.Status,
			CreatedAt: booking.CreatedAt,
		})
	}

	resp := pagination.PaginatedResponseTotal[*BookingWithUserInfoResponse]{
		Data:     response,
		Count:    int64(len(bookings)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}
	c.JSON(http.StatusOK, resp)
}
