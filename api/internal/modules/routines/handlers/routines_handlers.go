package routinehandlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	routinedomain "github.com/vitalfit/api/internal/modules/routines/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

// @Summary		Create a new routine template
// @Description	Creates a routine template with exercises. Only for Instructors/Admins.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		CreateRoutineRequest	true	"Routine creation payload"
// @Success		201		{object}	routinedomain.Routine	"Routine created successfully"
// @Failure		400		{object}	object{error=string}	"Bad Request"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/routines [post]
func (h *RoutineHandlers) CreateRoutineHandler(c *gin.Context) {
	var payload CreateRoutineRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)

	// Map DTO to Domain
	routine := &routinedomain.Routine{
		Name:        payload.Name,
		Description: payload.Description,
		Level:       routinedomain.RoutineLevel(payload.Level),
		ServiceID:   payload.ServiceID,
		CreatorID:   &user.UserID,
	}

	for _, exDto := range payload.Exercises {
		routine.RoutineExercises = append(routine.RoutineExercises, routinedomain.RoutineExercise{
			ExerciseID: exDto.ExerciseID,
			Sets:       exDto.Sets,
			Reps:       exDto.Reps,
			RestTime:   exDto.RestTime,
			Order:      exDto.Order,
			Notes:      exDto.Notes,
		})
	}

	if err := h.services.Routine.CreateRoutine(c.Request.Context(), routine); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, routine)
}

// @Summary		Assign a routine to a client
// @Description	Assigns an existing routine template to a client. Only for Instructors.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		AssignRoutineRequest	true	"Assignment payload"
// @Success		201		{object}	map[string]string		"Success message"
// @Failure		400		{object}	object{error=string}	"Bad Request"
// @Failure		404		{object}	object{error=string}	"Not Found (Instructor/Client/Routine)"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/routines/assign [post]
func (h *RoutineHandlers) AssignRoutineHandler(c *gin.Context) {
	var payload AssignRoutineRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)

	instructor, err := h.services.InstructorServices.GetInstructorByUserID(c.Request.Context(), user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	err = h.services.Routine.AssignRoutine(c.Request.Context(), instructor.InstructorID, payload.ClientID, payload.RoutineID, payload.DueDate)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Routine assigned successfully"})
}

// @Summary		Get my assigned routines
// @Description	Retrieves the list of active routines assigned to the authenticated client.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int									false	"Number of results per page"
// @Param			page	query		int									false	"Page number"
// @Param			sort	query		string								false	"Sort order (asc/desc)"
// @Param			search	query		string								false	"Search term"
// @Success		200		{object}	object{data=[]UserRoutineResponse}	"List of assigned routines"
// @Failure		500		{object}	object{error=string}				"Internal Server Error"
// @Router			/routines/my-routines [get]
func (h *RoutineHandlers) GetMyRoutinesHandler(c *gin.Context) {
	user := h.services.UserServices.GetUserFromContext(c)

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	routines, total, err := h.services.Routine.GetClientRoutines(c.Request.Context(), user.UserID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]UserRoutineResponse, 0, len(routines))
	for _, r := range routines {
		instructorName := "Unknown"
		if r.Instructor.User != nil {
			instructorName = fmt.Sprintf("%s %s", r.Instructor.User.FirstName, r.Instructor.User.LastName)
		}

		response = append(response, UserRoutineResponse{
			UserRoutineID:   r.UserRoutineID,
			RoutineID:       r.RoutineID,
			ServiceID:       r.Routine.ServiceID,
			RoutineName:     r.Routine.Name,
			Level:           string(r.Routine.Level),
			Instructor:      instructorName,
			AssignedDate:    r.AssignedDate,
			DueDate:         r.DueDate,
			Status:          string(r.Status),
			CompletionCount: r.CompletionCount,
			LastCompletedAt: r.LastCompletedAt,
		})
	}

	nextURL := fmt.Sprintf("/routines/my-routines?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/routines/my-routines?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, previousPage, fq.Sort, fq.Search)

	c.JSON(http.StatusOK, pagination.PaginatedResponseTotal[UserRoutineResponse]{
		Data:     response,
		Count:    int64(len(response)),
		Total:    total,
		Next:     nextURL,
		Previous: previousURL,
	})
}

// @Summary		Delete a routine
// @Description	Deletes a routine and its assignments. Only creator or superadmin.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Param			id	path		string					true	"Routine ID (UUID)"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		403	{object}	object{error=string}	"Forbidden"
// @Failure		404	{object}	object{error=string}	"Not Found"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/routines/{id} [delete]
func (h *RoutineHandlers) DeleteRoutineHandler(c *gin.Context) {
	ctx := c.Request.Context()
	idStr := c.Param("id")
	routineID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		permission := "routines:delete"
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

	err = h.services.Routine.DeleteRoutine(ctx, routineID, user)
	if err != nil {
		if err == shared_errors.ErrForbidden {
			h.services.LogErrors.ForbiddenResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Update a routine
// @Description	Updates an existing routine. Only creator or superadmin.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Param			id		path		string					true	"Routine ID (UUID)"
// @Param			payload	body		UpdateRoutineRequest	true	"Routine update payload"
// @Success		204		{object}	nil						"No Content"
// @Failure		400		{object}	object{error=string}	"Bad Request"
// @Failure		403		{object}	object{error=string}	"Forbidden"
// @Failure		404		{object}	object{error=string}	"Not Found"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/routines/{id} [put]
func (h *RoutineHandlers) UpdateRoutineHandler(c *gin.Context) {
	idStr := c.Param("id")
	routineID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var payload UpdateRoutineRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)

	routine := &routinedomain.Routine{
		Name:        payload.Name,
		Description: payload.Description,
		Level:       routinedomain.RoutineLevel(payload.Level),
		ServiceID:   payload.ServiceID,
	}

	for _, exDto := range payload.Exercises {
		routine.RoutineExercises = append(routine.RoutineExercises, routinedomain.RoutineExercise{
			ExerciseID: exDto.ExerciseID,
			Sets:       exDto.Sets,
			Reps:       exDto.Reps,
			RestTime:   exDto.RestTime,
			Order:      exDto.Order,
			Notes:      exDto.Notes,
		})
	}

	err = h.services.Routine.UpdateRoutine(c.Request.Context(), routineID, routine, user)
	if err != nil {
		if err == shared_errors.ErrForbidden {
			h.services.LogErrors.ForbiddenResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Create a new exercise
// @Description	Creates a new exercise in the library. Only for Instructors/Admins.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		CreateExerciseRequest	true	"Exercise creation payload"
// @Success		201		{object}	routinedomain.Exercise	"Exercise created successfully"
// @Failure		400		{object}	object{error=string}	"Bad Request"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/exercises [post]
func (h *RoutineHandlers) CreateExerciseHandler(c *gin.Context) {
	var payload CreateExerciseRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	exercise := &routinedomain.Exercise{
		Name:        payload.Name,
		Description: payload.Description,
		VideoURL:    payload.VideoURL,
		MuscleGroup: routinedomain.MuscleGroup(payload.MuscleGroup),
	}

	if err := h.services.Routine.CreateExercise(c.Request.Context(), exercise); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, exercise)
}

// @Summary		List exercises
// @Description	Retrieves a paginated list of exercises from the catalog.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int										false	"Number of results per page"
// @Param			page	query		int										false	"Page number"
// @Param			sort	query		string									false	"Sort order (asc/desc)"
// @Param			search	query		string									false	"Search term"
// @Success		200		{object}	object{data=[]routinedomain.Exercise}	"List of exercises"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/exercises [get]
func (h *RoutineHandlers) GetExercisesHandler(c *gin.Context) {
	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "asc",
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	exercises, total, err := h.services.Routine.GetExercises(c.Request.Context(), fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	nextURL := fmt.Sprintf("/exercises?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/exercises?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, previousPage, fq.Sort, fq.Search)

	c.JSON(http.StatusOK, pagination.PaginatedResponseTotal[*routinedomain.Exercise]{
		Data:     exercises,
		Count:    int64(len(exercises)),
		Total:    total,
		Next:     nextURL,
		Previous: previousURL,
	})
}

// @Summary		Get client routines
// @Description	Retrieves the list of active routines assigned to a specific client. Only for Instructors/Admins.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id		path		string								true	"Client ID (UUID)"
// @Param			limit	query		int									false	"Number of results per page"
// @Param			page	query		int									false	"Page number"
// @Param			sort	query		string								false	"Sort order (asc/desc)"
// @Param			search	query		string								false	"Search term"
// @Success		200		{object}	object{data=[]UserRoutineResponse}	"List of assigned routines"
// @Failure		400		{object}	object{error=string}				"Bad Request"
// @Failure		500		{object}	object{error=string}				"Internal Server Error"
// @Router			/routines/client/{id} [get]
func (h *RoutineHandlers) GetClientRoutinesHandler(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}
	fq, err = fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	routines, total, err := h.services.Routine.GetClientRoutines(c.Request.Context(), clientID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]UserRoutineResponse, 0, len(routines))
	for _, r := range routines {
		instructorName := "Unknown"
		if r.Instructor.User != nil {
			instructorName = fmt.Sprintf("%s %s", r.Instructor.User.FirstName, r.Instructor.User.LastName)
		}

		response = append(response, UserRoutineResponse{
			UserRoutineID:   r.UserRoutineID,
			RoutineID:       r.RoutineID,
			ServiceID:       r.Routine.ServiceID,
			RoutineName:     r.Routine.Name,
			Level:           string(r.Routine.Level),
			Instructor:      instructorName,
			AssignedDate:    r.AssignedDate,
			DueDate:         r.DueDate,
			Status:          string(r.Status),
			CompletionCount: r.CompletionCount,
			LastCompletedAt: r.LastCompletedAt,
		})
	}

	nextURL := fmt.Sprintf("/routines/client/%s?limit=%d&page=%d&sort=%s&search=%s", clientID, fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/routines/client/%s?limit=%d&page=%d&sort=%s&search=%s", clientID, fq.Limit, previousPage, fq.Sort, fq.Search)

	c.JSON(http.StatusOK, pagination.PaginatedResponseTotal[UserRoutineResponse]{
		Data:     response,
		Count:    int64(len(response)),
		Total:    total,
		Next:     nextURL,
		Previous: previousURL,
	})
}

// @Summary		Get routines created by instructor
// @Description	Retrieves a paginated list of routines created by the authenticated instructor.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int										false	"Number of results per page"
// @Param			page	query		int										false	"Page number"
// @Param			sort	query		string									false	"Sort order (asc/desc)"
// @Param			search	query		string									false	"Search term"
// @Success		200		{object}	object{data=[]routinedomain.Routine}	"List of routines"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/routines/my-created [get]
func (h *RoutineHandlers) GetInstructorRoutinesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		permission := "routines:list"
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

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	routines, total, err := h.services.Routine.GetRoutinesByCreator(ctx, user.UserID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	nextURL := fmt.Sprintf("/routines/my-created?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/routines/my-created?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, previousPage, fq.Sort, fq.Search)

	c.JSON(http.StatusOK, pagination.PaginatedResponseTotal[*routinedomain.Routine]{
		Data:     routines,
		Count:    int64(len(routines)),
		Total:    total,
		Next:     nextURL,
		Previous: previousURL,
	})
}

// @Summary		Get routine by ID
// @Description	Retrieves details of a specific routine template.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Routine ID (UUID)"
// @Success		200	{object}	routinedomain.Routine	"Routine details"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		404	{object}	object{error=string}	"Not Found"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/routines/{id} [get]
func (h *RoutineHandlers) GetRoutineByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)
	if user.Role.Name != "client" {
		permission := "routines:get"
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
	idStr := c.Param("id")
	routineID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	routine, err := h.services.Routine.GetRoutineByID(c.Request.Context(), routineID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, routine)
}

// @Summary		Mark routine as completed
// @Description	Increments the completion counter and updates the last completed date for a user's routine.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Param			id	path		string					true	"User Routine ID (UUID)"
// @Success		200	{object}	map[string]string		"Success message"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		403	{object}	object{error=string}	"Forbidden"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/routines/my-routines/{id}/complete [post]
func (h *RoutineHandlers) MarkRoutineCompletionHandler(c *gin.Context) {
	idStr := c.Param("id")
	userRoutineID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)

	if err := h.services.Routine.MarkRoutineCompletion(c.Request.Context(), userRoutineID, user.UserID); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Routine marked as completed"})
}

// @Summary		List all routines
// @Description	Retrieves a paginated list of all routine templates.
// @Tags			Routines
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int										false	"Number of results per page"
// @Param			page	query		int										false	"Page number"
// @Param			sort	query		string									false	"Sort order (asc/desc)"
// @Param			search	query		string									false	"Search term"
// @Success		200		{object}	object{data=[]routinedomain.Routine}	"List of routines"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/routines [get]
func (h *RoutineHandlers) GetAllRoutinesHandler(c *gin.Context) {
	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	routines, total, err := h.services.Routine.GetAllRoutines(c.Request.Context(), fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	nextURL := fmt.Sprintf("/routines?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/routines?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, previousPage, fq.Sort, fq.Search)

	c.JSON(http.StatusOK, pagination.PaginatedResponseTotal[*routinedomain.Routine]{
		Data:     routines,
		Count:    int64(len(routines)),
		Total:    total,
		Next:     nextURL,
		Previous: previousURL,
	})
}
