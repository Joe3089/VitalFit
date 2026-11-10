package instructorhandler

import (
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/mailer"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Create a new instructor
// @Description	Creates a new instructor, which also creates an associated user with the 'instructor' role.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			instructor	body		CreateInstructorPayload	true	"Instructor creation payload"
// @Success		201			{object}	nil						"Instructor created successfully"
// @Failure		400			{object}	map[string]interface{}	"Bad Request: Invalid payload"
// @Failure		409			{object}	map[string]interface{}	"Conflict: User with this email or identity document already exists"
// @Failure		500			{object}	map[string]interface{}	"Internal Server Error"
// @Router			/instructor [post]
func (h *InstructorHandlers) CreateInstructorHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateInstructorPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	instructor, err := payload.toInstructor()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	plainToken := uuid.New().String()

	hash := sha256.Sum256([]byte(plainToken))
	hashToken := hex.EncodeToString(hash[:])

	err = h.services.InstructorServices.CreateInstructor(ctx, instructor, hashToken)
	if err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	//send email -> error -> rollback
	status, err := h.services.AuthServices.MailSenderStaff(ctx, instructor.User, plainToken, mailer.UserStaffActivate)
	if err != nil {
		h.services.Logger.Errorw("error sending activation url to email", "error", err)
		if err := h.services.AuthServices.DeleteResetToken(ctx, instructor.UserID); err != nil {
			h.services.Logger.Errorw("error deleting user activation token ", "error", err)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(status, gin.H{"message": "instructor created"})

}

// @Summary		List all instructors
// @Description	Retrieves a list of all instructors in the system.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			limit			query		int										false	"Number of results per page"
// @Param			page			query		int										false	"Page number"
// @Param			sort			query		string									false	"Sort order (asc/desc)"
// @Param			search			query		string									false	"Search term for first name, last name, or email"
// @Param			identity_doc	query		string									false	"Filter by identity document"
// @Success		200				{object}	object{data=[]ListInstructorResponse}	"List of instructors"
// @Failure		400				{object}	object{error=string}					"Error: Bad Request (e.g., invalid query parameters)"
// @Failure		500				{object}	map[string]interface{}					"Internal Server Error"
// @Router			/instructor [get]
func (h *InstructorHandlers) GetInstructorsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit:        10,
		Page:         1,
		Search:       "",
		Sort:         "desc",
		Identity_doc: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	nextURL := fmt.Sprintf("/instructor/all?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/instructor/all?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	instructors, err := h.services.InstructorServices.GetInstructors(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]*ListInstructorResponse, 0, len(instructors))
	for _, instructor := range instructors {
		ins := &ListInstructorResponse{
			InstructorID:      instructor.InstructorID,
			UserID:            instructor.UserID,
			FirstName:         instructor.User.FirstName,
			LastName:          instructor.User.LastName,
			Email:             instructor.User.Email,
			Phone:             instructor.User.Phone,
			IdentityDocument:  instructor.User.IdentityDocument,
			BirthDate:         instructor.User.BirthDate,
			Gender:            string(instructor.User.Gender),
			ProfilePictureURL: instructor.User.ProfilePictureURL,
			Biography:         instructor.Biography,
		}
		response = append(response, ins)
	}
	total, err := h.services.InstructorServices.GetInstructorsFTotal(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	pagResponse := pagination.PaginatedResponseTotal[*ListInstructorResponse]{
		Data:     response,
		Count:    int64(len(instructors)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}
	c.JSON(http.StatusOK, pagResponse)
}

// @Summary		Get a summary of instructors
// @Description	Retrieves a count of total, active, and blocked instructors.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=instructordomain.InstructorSummary}	"Summary of instructors"
// @Failure		500	{object}	map[string]interface{}							"Internal Server Error"
// @Router			/instructor/summary [get]
func (h *InstructorHandlers) GetSummaryHandler(c *gin.Context) {
	ctx := c.Request.Context()
	summary, err := h.services.InstructorServices.GetSummary(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": summary})
}

// @Summary		Delete an instructor
// @Description	Deletes a specific instructor by their UUID.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Instructor UUID"
// @Success		204	{object}	nil						"Instructor deleted successfully"
// @Failure		400	{object}	map[string]interface{}	"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}	"Not Found: Instructor not found"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/instructor/{id} [delete]
func (h *InstructorHandlers) DeleteInstructorHandler(c *gin.Context) {
	ctx := c.Request.Context()
	instructorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.InstructorServices.DeleteInstructor(ctx, instructorID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Get instructor by ID
// @Description	Retrieves detailed information about a specific instructor by their UUID.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string							true	"Instructor UUID"
// @Success		200	{object}	object{data=InstructorResponse}	"Instructor details"
// @Failure		400	{object}	map[string]interface{}			"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}			"Not Found: Instructor not found"
// @Failure		500	{object}	map[string]interface{}			"Internal Server Error"
// @Router			/instructor/{id} [get]
func (h *InstructorHandlers) GetInstructorByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	if user.Role.Name != "client" {
		permission := "instructors:get"
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

	instructorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	instructor, err := h.services.InstructorServices.GetInstructorByID(ctx, instructorID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	specialtiesResponse := make([]*SpecialtyResponse, 0, len(instructor.Specialties))
	for _, s := range instructor.Specialties {
		specialtiesResponse = append(specialtiesResponse, &SpecialtyResponse{
			SpecialtyID:   s.CategoryID,
			SpecialtyName: s.Name,
		})
	}

	response := &InstructorResponse{
		InstructorID:      instructor.InstructorID,
		UserID:            instructor.UserID,
		FirstName:         instructor.User.FirstName,
		LastName:          instructor.User.LastName,
		Email:             instructor.User.Email,
		Phone:             instructor.User.Phone,
		IdentityDocument:  instructor.User.IdentityDocument,
		BirthDate:         instructor.User.BirthDate,
		Gender:            string(instructor.User.Gender),
		ProfilePictureURL: instructor.User.ProfilePictureURL,
		Specialties:       specialtiesResponse,
		Biography:         instructor.Biography,
	}

	c.JSON(http.StatusOK, gin.H{"data": response})

}

// @Summary		Update an instructor
// @Description	Updates an instructor's speciality and biography.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id			path		string					true	"Instructor UUID"
// @Param			instructor	body		UpdateInstructorPayload	true	"Payload with fields to update"
// @Success		204			{object}	nil						"Instructor updated successfully"
// @Failure		400			{object}	map[string]interface{}	"Bad Request: Invalid UUID or payload"
// @Failure		404			{object}	map[string]interface{}	"Not Found: Instructor not found"
// @Failure		500			{object}	map[string]interface{}	"Internal Server Error"
// @Router			/instructor/{id} [put]
func (h *InstructorHandlers) UpdateInstructorHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdateInstructorPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	instructorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	instructor, err := payload.toInstructor(instructorID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.InstructorServices.UpdateInstructor(ctx, instructor)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusNoContent, nil)

}

// @Summary		Export Instructors (CSV)
// @Description	Exports all instructors as a CSV file.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Success		200	{file}		file					"instructors.csv"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/instructor/export [get]
func (h *InstructorHandlers) ExportInstructorsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit: 1000000,
		Page:  1,
		Sort:  "desc",
	}

	instructors, err := h.services.InstructorServices.GetInstructors(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=instructors.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"ID", "First Name", "Last Name", "Email", "Phone", "Identity Document", "Gender", "Biography"})
	for _, i := range instructors {
		writer.Write([]string{
			i.InstructorID.String(),
			i.User.FirstName,
			i.User.LastName,
			i.User.Email,
			i.User.Phone,
			i.User.IdentityDocument,
			string(i.User.Gender),
			i.Biography,
		})
	}
}

// @Summary		Assign instructors to a branch
// @Description	Assigns one or more instructors to a specific branch using their UUIDs.
// @Tags			Branch Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id			path		string								true	"Branch UUID"
// @Param			instructors	body		AssignInstructorsToBranchPayload	true	"Payload with instructor UUIDs to assign"
// @Success		204			{object}	nil									"Instructors assigned successfully"
// @Failure		400			{object}	map[string]interface{}				"Bad Request: Invalid UUID or payload"
// @Failure		404			{object}	map[string]interface{}				"Not Found: Branch or one of the instructors not found"
// @Failure		409			{object}	map[string]interface{}				"Conflict: Instructor already assigned to this branch"
// @Failure		500			{object}	map[string]interface{}				"Internal Server Error"
// @Router			/branches/{id}/instructor [post]
func (h *InstructorHandlers) AssignInstructorsToBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload AssignInstructorsToBranchPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	instructor, err := payload.toInstructor()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return

	}

	err = h.services.InstructorServices.AssignInstructorsToBranch(ctx, branchID, instructor)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)

}

// @Summary		List instructors in a branch
// @Description	Retrieves a list of all instructors assigned to a specific branch.
// @Tags			Branch Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id				path		string									true	"Branch UUID"
// @Param			limit			query		int										false	"Number of results per page"
// @Param			page			query		int										false	"Page number"
// @Param			sort			query		string									false	"Sort order (asc/desc)"
// @Param			search			query		string									false	"Search term for first name, last name, or email"
// @Param			identity_doc	query		string									false	"Filter by identity document"
// @Success		200				{object}	object{data=[]BranchInstructorResponse}	"List of branch instructors"
// @Failure		400				{object}	map[string]interface{}					"Bad Request: Invalid UUID format or invalid query parameters"
// @Failure		404				{object}	map[string]interface{}					"Not Found: Branch not found"
// @Failure		500				{object}	map[string]interface{}					"Internal Server Error"
// @Router			/branches/{id}/instructor [get]
func (h *InstructorHandlers) ListBranchInstructorsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Search:       "",
		Identity_doc: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	instructors, err := h.services.InstructorServices.ListBranchInstructors(ctx, branchID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	response := make([]*BranchInstructorResponse, 0, len(instructors))
	for _, instructor := range instructors {
		ins := &BranchInstructorResponse{
			InstructorID:   instructor.InstructorID,
			InstructorName: instructor.User.FirstName + " " + instructor.User.LastName,
			Email:          instructor.User.Email,
			Phone:          instructor.User.Phone,
		}
		response = append(response, ins)
	}
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		Remove an instructor from a branch
// @Description	Removes a specific instructor from a specific branch.
// @Tags			Branch Instructors
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id				path		string					true	"Branch UUID"
// @Param			instructor_id	path		string					true	"Instructor UUID"
// @Success		204				{object}	nil						"Instructor removed successfully"
// @Failure		400				{object}	map[string]interface{}	"Bad Request: Invalid UUID format"
// @Failure		404				{object}	map[string]interface{}	"Not Found: Branch, instructor, or assignment not found"
// @Failure		500				{object}	map[string]interface{}	"Internal Server Error"
// @Router			/branches/{id}/instructor/{instructor_id} [delete]
func (h *InstructorHandlers) RemoveInstructorFromBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	instructorID, err := uuid.Parse(c.Param("instructor_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.InstructorServices.RemoveInstructorFromBranch(ctx, branchID, instructorID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)

}

// @Summary		Assign specialties to an instructor
// @Description	Assigns one or more specialties (service categories) to a specific instructor. This is an additive operation; it does not remove existing specialties.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id			path		string								true	"Instructor UUID"
// @Param			specialties	body		AssignInstructorsSpecialtiesPayload	true	"Payload with an array of specialty (category) UUIDs"
// @Success		204			{object}	nil									"Specialties assigned successfully"
// @Failure		400			{object}	map[string]interface{}				"Bad Request: Invalid UUID format or payload"
// @Failure		500			{object}	map[string]interface{}				"Internal Server Error"
// @Router			/instructor/{id}/specialty [post]
func (h *InstructorHandlers) AssignInstructorSpecialtyHandler(c *gin.Context) {
	ctx := c.Request.Context()
	instructorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload AssignInstructorsSpecialtiesPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	specialties, err := payload.toUUID()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.InstructorServices.AssignInstructorSpecialty(ctx, instructorID, specialties)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Remove a specialty from an instructor
// @Description	Removes a specific specialty (service category) from an instructor's profile.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id				path		string					true	"Instructor UUID"
// @Param			specialty_id	path		string					true	"Specialty (Category) UUID"
// @Success		204				{object}	nil						"Specialty removed successfully"
// @Failure		400				{object}	map[string]interface{}	"Bad Request: Invalid UUID format"
// @Failure		404				{object}	map[string]interface{}	"Not Found: Instructor or specialty assignment not found"
// @Failure		500				{object}	map[string]interface{}	"Internal Server Error"
// @Router			/instructor/{id}/specialty/{specialty_id} [delete]
func (h *InstructorHandlers) DeleteInstructorSpecialtyHandler(c *gin.Context) {
	ctx := c.Request.Context()
	instructorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	specialtyID, err := uuid.Parse(c.Param("specialty_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.InstructorServices.DeleteInstructorSpecialty(ctx, instructorID, specialtyID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusNoContent, nil)

}

// @Summary		Get assigned clients for an instructor
// @Description	Retrieves a paginated list of clients who have had at least one confirmed booking with this instructor. Clients are sorted by total bookings count.
// @Tags			Instructors
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string																						false	"Instructor UUID (Required for admins, ignored for instructors)"
// @Param			limit	query		int																							false	"Number of results per page (default: 10)"
// @Param			page	query		int																							false	"Page number (default: 1)"
// @Param			sort	query		string																						false	"Sort order by total_bookings (asc/desc, default: desc)"
// @Param			search	query		string																						false	"Search term for first name, last name, or email"
// @Success		200		{object}	object{data=[]AssignedClientResponse,count=int64,total=int64,next=string,previous=string}	"Paginated list of assigned clients"
// @Failure		400		{object}	map[string]interface{}																		"Bad Request: Invalid UUID or query parameters"
// @Failure		500		{object}	map[string]interface{}																		"Internal Server Error"
// @Router			/instructor/{id}/clients [get]
func (h *InstructorHandlers) GetAssignedClientsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	var instructorID uuid.UUID
	var err error

	if user.Role.Name == "instructor" {
		instructor, err := h.services.InstructorServices.GetInstructorByUserID(ctx, user.UserID)
		if err != nil {
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
		instructorID = instructor.InstructorID
	} else {
		permission := "instructors:get"
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
		instructorID, err = uuid.Parse(c.Param("id"))
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
	}

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Search: "",
		Sort:   "desc",
	}
	fq, err = fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	clients, err := h.services.InstructorServices.GetAssignedClients(ctx, instructorID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]*AssignedClientResponse, 0, len(clients))
	for _, client := range clients {
		response = append(response, &AssignedClientResponse{
			UserID:            client.UserID,
			FirstName:         client.FirstName,
			LastName:          client.LastName,
			Email:             client.Email,
			Phone:             client.Phone,
			TotalBookings:     client.TotalBookings,
			ProfilePictureURL: client.ProfilePictureURL,
		})
	}

	total, err := h.services.InstructorServices.GetAssignedClientsTotal(ctx, instructorID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	nextURL := fmt.Sprintf("/instructor/%s/clients?limit=%d&page=%d&sort=%s", instructorID, fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/instructor/%s/clients?limit=%d&page=%d&sort=%s", instructorID, fq.Limit, previousPage, fq.Sort)

	pagResponse := pagination.PaginatedResponseTotal[*AssignedClientResponse]{
		Data:     response,
		Count:    int64(len(clients)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}
	c.JSON(http.StatusOK, pagResponse)
}
