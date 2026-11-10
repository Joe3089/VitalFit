package staffhandlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Assign staff to a branch
// @Description	Assigns one or more staff members to a specific branch.
// @Tags			Branch Staff
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string						true	"Branch UUID"
// @Param			staff	body		AssignStaffToBranchPayload	true	"Payload with staff UUIDs"
// @Success		204		{object}	nil							"Staff assigned successfully"
// @Failure		400		{object}	map[string]interface{}		"Bad Request"
// @Failure		500		{object}	map[string]interface{}		"Internal Server Error"
// @Router			/branches/{id}/staff [post]
func (h *StaffHandlers) AssignStaffToBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload AssignStaffToBranchPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	staffIDs, err := payload.toUUIDs()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.Staff.AssignStaffToBranch(ctx, branchID, staffIDs)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Get managed branches
// @Description	Retrieves a list of branches managed by the current staff member (branch_admin).
// @Tags			Staff
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]BranchResponse}
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/staff/managed-branches [get]
func (h *StaffHandlers) GetManagedBranchesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	branches, err := h.services.Staff.GetManagedBranches(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]BranchResponse, 0, len(branches))
	for _, b := range branches {
		response = append(response, BranchResponse{
			ID:   b.BranchID,
			Name: b.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		List staff in a branch
// @Description	Retrieves a list of staff members assigned to a specific branch, optionally filtered by role.
// @Tags			Branch Staff
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string	true	"Branch UUID"
// @Param			role_id	query		string	false	"Filter by Role UUID"
// @Param			limit	query		int		false	"Number of results per page"
// @Param			page	query		int		false	"Page number"
// @Param			search	query		string	false	"Search term"
// @Success		200		{object}	object{data=[]BranchStaffResponse}
// @Failure		400		{object}	map[string]interface{}	"Bad Request"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/branches/{id}/staff [get]
func (h *StaffHandlers) ListBranchStaffByRoleHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{}
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

	var roleID uuid.UUID
	if rID := c.Query("role_id"); rID != "" {
		roleID, err = uuid.Parse(rID)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
	}

	users, total, err := h.services.Staff.ListBranchStaffByRole(ctx, branchID, roleID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]BranchStaffResponse, 0, len(users))
	for _, user := range users {
		s := BranchStaffResponse{
			UserID:    user.UserID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
			Phone:     user.Phone,
			Role:      user.Role.Name,
		}
		response = append(response, s)
	}

	// Generate navigation links
	q := c.Request.URL.Query()
	q.Set("limit", fmt.Sprintf("%d", fq.Limit))

	// Next URL
	q.Set("page", fmt.Sprintf("%d", fq.Page+1))
	nextURL := fmt.Sprintf("%s?%s", c.Request.URL.Path, q.Encode())

	// Previous URL
	prevPage := fq.Page - 1
	if prevPage < 1 {
		prevPage = 1
	}
	q.Set("page", fmt.Sprintf("%d", prevPage))
	previousURL := fmt.Sprintf("%s?%s", c.Request.URL.Path, q.Encode())

	resp := pagination.PaginatedResponseTotal[BranchStaffResponse]{
		Data:     response,
		Count:    int64(len(users)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		Get staff assigned branches
// @Description	Retrieves a list of branches where the current staff member is assigned.
// @Tags			Staff
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]BranchResponse}
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/staff/branches [get]
func (h *StaffHandlers) GetStaffBranchesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	branches, err := h.services.Staff.GetStaffBranches(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]BranchResponse, 0, len(branches))
	for _, b := range branches {
		response = append(response, BranchResponse{
			ID:   b.BranchID,
			Name: b.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		Get instructor branches
// @Description	Retrieves a list of branches where the current instructor is assigned.
// @Tags			Staff
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]BranchResponse}
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/staff/instructor-branches [get]
func (h *StaffHandlers) GetInstructorBranchesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	branches, err := h.services.Staff.GetInstructorBranches(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]BranchResponse, 0, len(branches))
	for _, b := range branches {
		response = append(response, BranchResponse{
			ID:   b.BranchID,
			Name: b.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		Remove staff from a branch
// @Description	Removes a specific staff member from a specific branch.
// @Tags			Branch Staff
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id		path		string					true	"Branch UUID"
// @Param			staffId	path		string					true	"Staff UUID"
// @Success		204		{object}	nil						"Staff removed successfully"
// @Failure		400		{object}	map[string]interface{}	"Bad Request"
// @Failure		404		{object}	map[string]interface{}	"Not Found"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/branches/{id}/staff/{staffId} [delete]
func (h *StaffHandlers) RemoveStaffFromBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	staffID, err := uuid.Parse(c.Param("staffId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.Staff.RemoveStaffFromBranch(ctx, branchID, staffID)
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
