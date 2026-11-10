package branchhandlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		create a new branch
// @Description	adds a new branc to the system with his ubication and configuration
// @Tags			Branches
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			branch	body		CreateBranchPayload		true	"Payload needed for the branch creation"
// @Success		201		{object}	object{message=string}	"suceed message"
// @Failure		400		{object}	object{error=string}	"Error: bad request"
// @Failure		500		{object}	object{error=string}	"Error: internal server error"
// @Router			/branches [post]
func (h *BranchHandlers) CreateBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateBranchPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	user, err := h.services.UserServices.GetByID(ctx, payload.ManagerID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	if user.Role.Name != "branch_admin" {
		h.services.LogErrors.ForbiddenResponse(c)
		return
	}

	branch, err := payload.toBranch()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	//operating hours
	var branchOperatingHours []branchdomain.OperatingHours
	for _, operatingHour := range payload.OperatingHours {
		operatingHour, err := operatingHour.toOperatingHour()
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
		branchOperatingHours = append(branchOperatingHours, *operatingHour)
	}
	branch.OperatingHours = branchOperatingHours
	//state
	state, err := h.services.LocationsServices.FindOrCreateStateByCountry(ctx, payload.State, payload.Country)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	branch.StateID = state.StateID
	//create branch
	if err := h.services.BranchesServices.CreateBranch(ctx, branch); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"message": "branch created",
	})

}

// @Summary		Update a branch
// @Description	Updates an existing branch's information.
// @Tags			Branches
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Branch UUID"
// @Param			branch	body		UpdateBranchPayload		true	"Payload with the fields to update"
// @Success		200		{object}	object{data=string}		"Branch updated successfully"
// @Failure		400		{object}	object{error=string}	"Error: Bad Request - Malformed ID or invalid payload"
// @Failure		404		{object}	object{error=string}	"Error: Not Found - Branch not found"
// @Failure		500		{object}	object{error=string}	"Error: Internal Server Error"
// @Router			/branches/{id} [put]
func (h *BranchHandlers) UpdateBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	idStr := c.Param("id")
	branchID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var payload UpdateBranchPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	States, err := h.services.LocationsServices.FindOrCreateStateByCountry(ctx, payload.State, payload.Country)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	var branchOperatingHours []branchdomain.OperatingHours
	for _, operatingHour := range payload.OperatingHours {
		operatingHour, err := operatingHour.toOperatingHour()
		operatingHour.BranchID = branchID
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
		branchOperatingHours = append(branchOperatingHours, *operatingHour)
	}

	updatedbranch := &branchdomain.Branch{
		BranchID:       branchID,
		Name:           payload.Name,
		TaxID:          payload.TaxID,
		Address:        payload.Address,
		Latitude:       payload.Latitude,
		Longitude:      payload.Longitude,
		MaxCapacity:    payload.MaxCapacity,
		Phone:          payload.Phone,
		Status:         branchdomain.BranchStatusEnum(payload.Status),
		ManagerID:      payload.ManagerID,
		StateID:        States.StateID,
		OperatingHours: branchOperatingHours,
	}

	if err := h.services.BranchesServices.UpdateBranch(ctx, updatedbranch); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": "branch updated successfully",
	})
}

// @Summary		Get a branch list
// @Description	Get a branch list paginated with optional filters
// @Tags			Branches
// @Security		ApiKeyAuth
// @Param			limit		query	int		false	"limit results per page"				default(10)			minimum(1)	maximum(100)
// @Param			page		query	int		false	"page number of results (pagination)"	default(1)			minimum(1)
// @Param			sort		query	string	false	"clasification order (asc or desc)"		enums(asc, desc)	default(desc)
// @Param			status		query	string	false	"filter by status"						enums(Active, Inactive, Maintenance)
// @Param			search		query	string	false	"global search across branch and manager name"
// @Param			location	query	string	false	"filter by location (state or country)"
// @Accept			json
// @Produce		json
// @Success		200	{object}	object{data=[]BranchListResponse}	"succed response"
// @Failure		400	{object}	object{error=string}				"Error: invalid params"
// @Failure		500	{object}	object{error=string}				"Error: internal server error"
// @Router			/branches [get]
func (h *BranchHandlers) GetBranchesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}

	nextURL := fmt.Sprintf("/branches?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/branches?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	branches, err := h.services.BranchesServices.GetBranches(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	responseList := make([]BranchListResponse, 0, len(branches.Branches))

	for _, branch := range branches.Branches {

		resp := BranchListResponse{
			BranchID:        branch.BranchID,
			Name:            branch.Name,
			TaxID:           branch.TaxID,
			Status:          string(branch.Status),
			StateName:       branch.State.Name,
			CountryName:     branch.State.Country.Name,
			ManagerName:     branch.Manager.FirstName,
			ManagerLastName: branch.Manager.LastName,
		}

		responseList = append(responseList, resp)
	}
	count := int64(len(responseList))

	resp := pagination.PaginatedResponse[BranchListResponse]{
		Data:     responseList,
		Count:    count,
		Next:     nextURL,
		Previous: previousURL,
	}

	c.JSON(http.StatusOK, resp)

}

func (h *BranchHandlers) BranchStatusCount(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

}

// @Summary		Delete a branch
// @Description	Deletes a specific branch by its UUID. Requires "super_admin" role.
// @Tags			Branches
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id	path		string					true	"Branch UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"Error: Bad Request - Malformed ID"
// @Failure		401	{object}	object{error=string}	"Error: Unauthorized - Token required"
// @Failure		403	{object}	object{error=string}	"Error: Forbidden - Not super_admin"
// @Failure		404	{object}	object{error=string}	"Error: Not Found - Branch not found"
// @Failure		500	{object}	object{error=string}	"Error: Internal Server Error"
// @Router			/branches/{id} [delete]
func (h *BranchHandlers) DeleteBranchHandler(c *gin.Context) {
	idStr := c.Param("id")

	branchID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	ctx := c.Request.Context()
	if err := h.services.BranchesServices.DeleteBranch(ctx, branchID); err != nil {
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

// @Summary		Get branch by ID
// @Description	Retrieves detailed information about a specific branch using its UUID.
// @Tags			Branches
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string							true	"Branch UUID"
// @Success		200	{object}	object{data=BranchResponseData}	"Branch details"
// @Failure		400	{object}	object{error=string}			"Error: Bad Request - Malformed ID"
// @Failure		404	{object}	object{error=string}			"Error: Not Found - Branch not found"
// @Failure		500	{object}	object{error=string}			"Error: Internal Server Error"
// @Router			/branches/{id} [get]
func (h *BranchHandlers) GetBranchByIDHandler(c *gin.Context) {
	idStr := c.Param("id")

	branchID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	ctx := c.Request.Context()
	branch, err := h.services.BranchesServices.GetBranchByID(ctx, branchID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return

	}
	response := &BranchResponseData{
		BranchID:         branch.BranchID,
		Name:             branch.Name,
		TaxID:            branch.TaxID,
		Address:          branch.Address,
		Latitude:         branch.Latitude,
		Longitude:        branch.Longitude,
		MaxCapacity:      branch.MaxCapacity,
		Phone:            branch.Phone,
		Status:           string(branch.Status),
		State:            branch.State.Name,
		Country:          branch.State.Country.Name,
		ManagerID:        branch.ManagerID,
		ManagerFirstName: branch.Manager.FirstName,
		ManagerLastName:  branch.Manager.LastName,
		OperatingHours:   branch.OperatingHours,
	}

	c.JSON(http.StatusOK, response)
}

// @Summary		Get a count data for each status branch
// @Description	Get a count data for each status branch
// @Tags			Branches
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]branchdomain.BranchStatusCount}	"general count of branch statuses"
// @Failure		500	{object}	object{error=string}							"Error: internal server error"
// @Router			/branches/status [get]
func (h *BranchHandlers) GetBranchStatusCount(c *gin.Context) {
	ctx := c.Request.Context()

	statusCount, err := h.services.BranchesServices.GetBranchStatusCount(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": statusCount,
	})

}

// @Summary		Get public branches for map
// @Description	Retrieves a list of public branches with minimal information for map display.
// @Tags			Public
// @Produce		json
// @Success		200	{object}	object{data=[]PublicBranchMapResponse}	"A list of public branches for the map"
// @Failure		500	{object}	object{error=string}					"Error: Internal Server Error"
// @Router			/public/branches-map [get]
func (h *BranchHandlers) GetPublicBranchesMapHandler(c *gin.Context) {
	ctx := c.Request.Context()

	branches, err := h.services.BranchesServices.GetPublicBranchesMap(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": branches,
	})
}
