package schedulehandlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	accessdomain "github.com/vitalfit/api/internal/modules/access/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	"gorm.io/gorm"
)

// ------------------------------
// POST /branches/:id/schedule
// ------------------------------

// @Summary		Create a scheduled class
// @Description	Creates a class in the branch schedule
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Branch UUID"
// @Param			class	body		CreateClassPayload		true	"Class payload"
// @Success		201		{object}	map[string]interface{}	"Class created"
// @Failure		400		{object}	map[string]interface{}	"Invalid input"
// @Failure		500		{object}	map[string]interface{}	"Server error"
// @Router			/branches/{id}/schedule [post]
func (h *ScheduleHandlers) CreateClassHandler(c *gin.Context) {
	ctx := c.Request.Context()

	var payload CreateClassPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	branch, err := h.services.BranchesServices.GetBranchByID(ctx, branchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	class, err := payload.ToClass(branchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	instructorUser, err := h.services.InstructorServices.GetInstructorByID(ctx, class.InstructorID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	// Map operational days for quick lookup
	operationalDays := make(map[branchdomain.DayOfWeekEnum]bool)
	hasOperatingHours := len(branch.OperatingHours) > 0
	if hasOperatingHours {
		for _, oh := range branch.OperatingHours {
			if !oh.IsClosed {
				operationalDays[oh.DayOfWeek] = true
			}
		}

		var dayEnum branchdomain.DayOfWeekEnum
		switch class.StartsAt.Weekday() {
		case time.Monday:
			dayEnum = branchdomain.DayMonday
		case time.Tuesday:
			dayEnum = branchdomain.DayTuesday
		case time.Wednesday:
			dayEnum = branchdomain.DayWednesday
		case time.Thursday:
			dayEnum = branchdomain.DayThursday
		case time.Friday:
			dayEnum = branchdomain.DayFriday
		case time.Saturday:
			dayEnum = branchdomain.DaySaturday
		case time.Sunday:
			dayEnum = branchdomain.DaySunday
		}

		if !operationalDays[dayEnum] {
			h.services.LogErrors.BadRequestResponse(c, errors.New("the branch is closed on the selected start date"))
			return
		}
	}

	// Logic for recurrence
	var classes []scheduledomain.Class
	classes = append(classes, *class)

	if payload.Recurrence == "daily" || payload.Recurrence == "weekly" {
		// Limit recurrence to max 3 months to prevent infinite or too long creation
		maxDate := class.StartsAt.AddDate(0, 3, 0)
		limitDate := payload.RecurrenceUntil
		if limitDate.IsZero() || limitDate.After(maxDate) {
			limitDate = maxDate
		}

		nextStart := class.StartsAt
		nextEnd := class.EndsAt

		for {
			switch payload.Recurrence {
			case "daily":
				nextStart = nextStart.AddDate(0, 0, 1)
				nextEnd = nextEnd.AddDate(0, 0, 1)
			case "weekly":
				nextStart = nextStart.AddDate(0, 0, 7)
				nextEnd = nextEnd.AddDate(0, 0, 7)
			}

			if nextStart.After(limitDate) {
				break
			}

			// Skip non-operational days if operating hours are defined
			if hasOperatingHours {
				var dayEnum branchdomain.DayOfWeekEnum
				switch nextStart.Weekday() {
				case time.Monday:
					dayEnum = branchdomain.DayMonday
				case time.Tuesday:
					dayEnum = branchdomain.DayTuesday
				case time.Wednesday:
					dayEnum = branchdomain.DayWednesday
				case time.Thursday:
					dayEnum = branchdomain.DayThursday
				case time.Friday:
					dayEnum = branchdomain.DayFriday
				case time.Saturday:
					dayEnum = branchdomain.DaySaturday
				case time.Sunday:
					dayEnum = branchdomain.DaySunday
				}
				if !operationalDays[dayEnum] {
					continue
				}
			}

			newClass := *class
			newClass.StartsAt = nextStart
			newClass.EndsAt = nextEnd
			// Reset ID to allow generation of new UUID
			newClass.ClassID = uuid.Nil

			classes = append(classes, newClass)
		}
	}

	if err := h.services.ScheduleServices.CreateClasses(ctx, classes); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	// Notification to instructor
	go func() {
		notiCtx := context.Background()
		timeFormat := "15:04"
		dateFormat := "2006-01-02"

		var message string
		switch payload.Recurrence {
		case "daily":
			message = fmt.Sprintf("You have been assigned to a class starting on %s at %s. This class repeats daily.", class.StartsAt.Format(dateFormat), class.StartsAt.Format(timeFormat))
		case "weekly":
			weekday := class.StartsAt.Weekday().String()
			message = fmt.Sprintf("You have been assigned to a class starting on %s at %s. This class repeats every %s.", class.StartsAt.Format(dateFormat), class.StartsAt.Format(timeFormat), weekday)
		default:
			message = fmt.Sprintf("You have been assigned to a class on %s at %s.", class.StartsAt.Format(dateFormat), class.StartsAt.Format(timeFormat))
		}

		notification := &notidomain.Notification{
			UserID:  instructorUser.User.UserID,
			Title:   "New Class Assignment",
			Message: message,
			Type:    "info",
		}

		_ = h.services.NotificationServices.CreateNotification(notiCtx, notification)
		_ = h.services.NotificationServices.SendPushNotification(notiCtx, "New Class Assignment", message, instructorUser.User.UserID)
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Class created successfully",
		"class_id": class.ClassID,
	})
}

// ------------------------------
// GET /branches/:id/schedule
// ------------------------------

// @Summary		List classes for a branch
// @Description	Returns the scheduled classes for the branch
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id		path		string	true	"Branch UUID"
// @Param			month	query		int		false	"Month (1-12)"
// @Param			year	query		int		false	"Year"
// @Param			date	query		string	false	"Specific date (YYYY-MM-DD)"
// @Success		200		{object}	object{data=[]ClassResponse}
// @Failure		400		{object}	map[string]interface{}
// @Failure		500		{object}	map[string]interface{}
// @Router			/branches/{id}/schedule [get]
func (h *ScheduleHandlers) GetClassesByBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		permission := "schedule:list"
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
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
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

	var classes []scheduledomain.Class
	if user.Role.Name == "client" {
		classes, err = h.services.ScheduleServices.GetUpcomingClassesByBranch(ctx, branchID, startDate, endDate)
	} else {
		classes, err = h.services.ScheduleServices.GetClassesByBranch(ctx, branchID, startDate, endDate)
	}

	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			h.services.LogErrors.NotFoundResponse(c)
			return
		default:
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
	}

	resp := make([]ClassResponse, 0, len(classes))
	for _, class := range classes {
		resp = append(resp, ClassResponse{
			ClassID:            class.ClassID,
			BranchID:           class.BranchID,
			ServiceID:          class.ServiceID,
			InstructorID:       class.InstructorID,
			StartsAt:           class.StartsAt,
			EndsAt:             class.EndsAt,
			MaxCapacity:        class.MaxCapacity,
			IsVisible:          class.IsVisible,
			Notes:              class.Notes,
			Status:             class.Status,
			CancellationReason: class.CancellationReason,
			CancelledAt:        class.CancelledAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// ------------------------------
// GET /schedule/instructor
// ------------------------------

// @Summary		List classes for an instructor
// @Description	Returns the scheduled classes for a specific instructor (by user ID)
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Produce		json
// @Param			user_id		query		string	false	"User UUID (if not instructor)"
// @Param			month		query		int		false	"Month (1-12)"
// @Param			branch_id	query		string	false	"Branch UUID"
// @Param			year		query		int		false	"Year"
// @Param			date		query		string	false	"Specific date (YYYY-MM-DD)"
// @Success		200			{object}	object{data=[]ClassResponse}
// @Failure		400			{object}	map[string]interface{}
// @Failure		500			{object}	map[string]interface{}
// @Router			/schedule/instructor [get]
func (h *ScheduleHandlers) GetClassesByInstructorHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	var targetUserID uuid.UUID
	var err error

	if user.Role.Name == "instructor" {
		targetUserID = user.UserID
	} else {
		userIDStr := c.Query("user_id")
		if userIDStr == "" {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required"))
			return
		}
		targetUserID, err = uuid.Parse(userIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
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

	var branchID *uuid.UUID
	if branchIDStr := c.Query("branch_id"); branchIDStr != "" {
		id, err := uuid.Parse(branchIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("invalid branch_id"))
			return
		}
		branchID = &id
	}

	classes, err := h.services.ScheduleServices.GetClassesByInstructor(ctx, targetUserID, branchID, startDate, endDate)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	resp := make([]ClassResponse, 0, len(classes))
	for _, class := range classes {
		resp = append(resp, ClassResponse{
			ClassID:            class.ClassID,
			BranchID:           class.BranchID,
			ServiceID:          class.ServiceID,
			InstructorID:       class.InstructorID,
			StartsAt:           class.StartsAt,
			EndsAt:             class.EndsAt,
			MaxCapacity:        class.MaxCapacity,
			IsVisible:          class.IsVisible,
			Notes:              class.Notes,
			Status:             class.Status,
			CancellationReason: class.CancellationReason,
			CancelledAt:        class.CancelledAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// ------------------------------
// GET /schedule/:classId
// ------------------------------

// @Summary		Get class by ID
// @Description	Returns details of a scheduled class
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Produce		json
// @Param			classId	path		string	true	"Class UUID"
// @Success		200		{object}	object{data=ClassResponse}
// @Failure		400		{object}	map[string]interface{}
// @Failure		500		{object}	map[string]interface{}
// @Router			/schedule/{classId} [get]
func (h *ScheduleHandlers) GetClassByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		permission := "schedule:get"
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
	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	class, err := h.services.ScheduleServices.GetClassByID(ctx, classID)
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			h.services.LogErrors.NotFoundResponse(c)
			return
		default:
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
	}

	resp := ClassResponse{
		ClassID:            class.ClassID,
		BranchID:           class.BranchID,
		ServiceID:          class.ServiceID,
		InstructorID:       class.InstructorID,
		StartsAt:           class.StartsAt,
		EndsAt:             class.EndsAt,
		MaxCapacity:        class.MaxCapacity,
		IsVisible:          class.IsVisible,
		Notes:              class.Notes,
		Status:             class.Status,
		CancellationReason: class.CancellationReason,
		CancelledAt:        class.CancelledAt,
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// ------------------------------
// PUT /schedule/:classId
// ------------------------------

// @Summary		Update scheduled class
// @Description	Updates a class in the calendar
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			classId	path		string				true	"Class UUID"
// @Param			class	body		UpdateClassPayload	true	"Class update payload"
// @Success		204		{object}	nil
// @Failure		400		{object}	map[string]interface{}
// @Failure		500		{object}	map[string]interface{}
// @Router			/schedule/{classId} [put]
func (h *ScheduleHandlers) UpdateClassHandler(c *gin.Context) {
	ctx := c.Request.Context()

	var payload UpdateClassPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	class, err := payload.ToClassUpdate(classID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.ScheduleServices.UpdateClass(ctx, class); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ------------------------------
// DELETE /schedule/:classId
// ------------------------------

// @Summary		Delete scheduled class
// @Description	Deletes or cancels a class from the calendar
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Produce		json
// @Param			classId	path		string	true	"Class UUID"
// @Success		204		{object}	nil
// @Failure		400		{object}	map[string]interface{}
// @Failure		500		{object}	map[string]interface{}
// @Router			/schedule/{classId} [delete]
func (h *ScheduleHandlers) DeleteClassHandler(c *gin.Context) {
	ctx := c.Request.Context()

	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.ScheduleServices.DeleteClass(ctx, classID); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ------------------------------
// GET /classes/:id/attendance/history
// ------------------------------

// @Summary		Get class attendance history
// @Description	Retrieves the attendance history for a specific class with optional filtering by date and status
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id			path		string	true	"Class UUID"
// @Param			start_date	query		string	false	"Filter by start date (RFC3339 format)"
// @Param			end_date	query		string	false	"Filter by end date (RFC3339 format)"
// @Param			status		query		string	false	"Filter by status (Attended, NoShow, Cancelled)"	Enums(Attended, NoShow, Cancelled)
// @Success		200			{object}	object{data=[]AttendanceHistoryResponse}
// @Failure		400			{object}	object{error=string}	"Invalid input"
// @Failure		404			{object}	object{error=string}	"Class not found"
// @Failure		500			{object}	object{error=string}	"Server error"
// @Router			/classes/{id}/attendance/history [get]
func (h *ScheduleHandlers) GetClassAttendanceHistoryHandler(c *gin.Context) {
	ctx := c.Request.Context()

	classID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	// Build filter from query parameters
	filter := scheduledomain.AttendanceHistoryFilter{
		ClassID: classID,
	}

	// Parse optional date filters
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
		filter.StartDate = &startDate
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
		filter.EndDate = &endDate
	}

	// Parse optional status filter
	if statusStr := c.Query("status"); statusStr != "" {
		// Validate status
		status := accessdomain.AttendanceStatus(statusStr)
		if status != accessdomain.AttendanceStatusAttended &&
			status != accessdomain.AttendanceStatusNoShow &&
			status != accessdomain.AttendanceStatusCancelled {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
		filter.Status = &statusStr
	}

	// Get attendance history
	attendancesRaw, err := h.services.ScheduleServices.GetClassAttendanceHistory(ctx, filter)
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	// Build response
	resp := make([]*AttendanceHistoryResponse, 0, len(attendancesRaw))
	for _, attendanceRaw := range attendancesRaw {
		attendance := attendanceRaw.(*accessdomain.AttendanceLog)
		item := &AttendanceHistoryResponse{
			AttendanceID: attendance.AttendanceID,
			UserID:       attendance.UserID,
			ServiceID:    attendance.ServiceID,
			CheckInTime:  attendance.CheckInTime,
			Status:       attendance.Status,
		}

		// Add user info if preloaded
		if attendance.User.UserID != uuid.Nil {
			item.UserName = attendance.User.FirstName + " " + attendance.User.LastName
			item.UserEmail = attendance.User.Email
		}

		// Add service info if preloaded
		if attendance.Service.ServiceID != uuid.Nil {
			item.ServiceName = attendance.Service.Name
		}

		resp = append(resp, item)
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}
