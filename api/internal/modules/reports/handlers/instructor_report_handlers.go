package reporthandlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary		Get Instructor Next Class
// @Description	Retrieves the start time of the next class for a specific instructor today.
// @Tags			Reports Instructor
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=string}		"Next class time or 'Sin pendientes'"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/instructors/next-class [get]
func (h *ReportHanlders) GetInstructorNextClassHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	// Buscar el InstructorID asociado al UserID del token
	instructorID, err := h.services.ReportServices.GetInstructorIDByUserID(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	result, err := h.services.ReportServices.GetInstructorNextClass(ctx, *instructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// @Summary		Get Instructor Student Count KPI
// @Description	Retrieves the total number of unique students attended by the instructor today, compared to the same day last week.
// @Tags			Reports Instructor
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=reportdomain.KPICard}	"Student count KPI"
// @Failure		400	{object}	object{error=string}				"Bad Request"
// @Failure		500	{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/instructors/student-count [get]
func (h *ReportHanlders) GetInstructorStudentCountKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	instructorID, err := h.services.ReportServices.GetInstructorIDByUserID(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	kpi, err := h.services.ReportServices.GetInstructorStudentCountKPI(ctx, *instructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Instructor Monthly Classes Count
// @Description	Retrieves the total number of classes assigned to the instructor for the current month.
// @Tags			Reports Instructor
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=reportdomain.KPICard}	"Classes count KPI"
// @Failure		400	{object}	object{error=string}				"Bad Request"
// @Failure		500	{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/instructors/classes-count [get]
func (h *ReportHanlders) GetInstructorMonthlyClassesCountHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	instructorID, err := h.services.ReportServices.GetInstructorIDByUserID(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	kpi, err := h.services.ReportServices.GetInstructorMonthlyClassesCount(ctx, *instructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Instructor Classes Today
// @Description	Retrieves all classes assigned to the instructor for the current day, regardless of whether they have already happened.
// @Tags			Reports Instructor
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]reportdomain.ClassScheduleItem}	"List of classes today"
// @Failure		400	{object}	object{error=string}							"Bad Request"
// @Failure		500	{object}	object{error=string}							"Internal Server Error"
// @Router			/reports/instructors/classes-today [get]
func (h *ReportHanlders) GetInstructorClassesTodayHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	instructorID, err := h.services.ReportServices.GetInstructorIDByUserID(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	classes, err := h.services.ReportServices.GetInstructorClassesToday(ctx, *instructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": classes})
}

// @Summary		Get Instructor Students Today Count
// @Description	Retrieves the total number of students with confirmed bookings for the instructor's classes today.
// @Tags			Reports Instructor
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=int64}		"Students count"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/instructors/students-today [get]
func (h *ReportHanlders) GetInstructorStudentsTodayHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	instructor, err := h.services.InstructorServices.GetInstructorByUserID(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	count, err := h.services.InstructorServices.GetStudentsTodayCount(ctx, instructor.InstructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": count})
}

// @Summary		Get Instructor Attendance Rate Today
// @Description	Retrieves the attendance rate (Attended / Confirmed Bookings) for the instructor's classes today.
// @Tags			Reports Instructor
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=float64}	"Attendance rate percentage"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/instructors/attendance-rate [get]
func (h *ReportHanlders) GetInstructorAttendanceRateHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	instructor, err := h.services.InstructorServices.GetInstructorByUserID(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	rate, err := h.services.InstructorServices.GetAttendanceRateToday(ctx, instructor.InstructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rate})
}
