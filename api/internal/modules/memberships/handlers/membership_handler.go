package membershipshandlers

import (
	"encoding/csv"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Create a new membership type
// @Description	Adds a new membership type (plan) to the system.
// @Tags			Memberships
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			membership	body		CreateMembershipPayload				true	"Membership creation payload"
// @Success		201			{object}	membershipsdomain.MembershipType	"Membership type created successfully"
// @Failure		400			{object}	object{error=string}				"error: Bad Request"
// @Failure		409			{object}	object{error=string}				"error: Conflict"
// @Failure		500			{object}	object{error=string}				"error: Internal Server Error"
// @Router			/membership-plans [post]
func (h *MembershipHandler) CreateMembershipHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateMembershipPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	membership, err := payload.toMembership()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.MembershipServices.CreateMembershipType(ctx, membership)
	if err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusCreated, membership)
}

// @Summary		Update a membership type
// @Description	Updates an existing membership type’s details.
// @Tags			Memberships
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id			path		string								true	"Membership Type UUID"
// @Param			membership	body		UpdateMembershipPayload				true	"Membership update payload"
// @Success		200			{object}	membershipsdomain.MembershipType	"Membership type updated successfully"
// @Failure		400			{object}	object{error=string}				"error: Bad Request - Invalid ID or payload"
// @Failure		404			{object}	object{error=string}				"error: Not Found - Membership type not found"
// @Failure		500			{object}	object{error=string}				"error: Internal Server Error"
// @Router			/membership-plans/{id} [put]
func (h *MembershipHandler) UpdateMembershipHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdateMembershipPayload

	membershipID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	membership, err := payload.toMembership()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	membership.MembershipTypeID = membershipID

	err = h.services.MembershipServices.UpdateMembershipType(ctx, membership)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusOK, membership)
}

// @Summary		Delete a membership type
// @Description	Soft deletes a membership type from the system (sets inactive).
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string					true	"Membership Type UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Membership type not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/membership-plans/{id} [delete]
func (h *MembershipHandler) DeleteMembershipHandler(c *gin.Context) {
	ctx := c.Request.Context()
	membershipID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.MembershipServices.DeleteMembershipType(ctx, membershipID)
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

// @Summary		Get membership type by ID
// @Description	Retrieves a single membership type by its UUID.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string	true	"Membership Type UUID"
// @Success		200	{object}	object{data=MembershipResponse}
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Membership type not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/membership-plans/{id} [get]
func (h *MembershipHandler) GetMembershipByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	membershipID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	membership, err := h.services.MembershipServices.GetMembershipTypeByID(ctx, membershipID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := &MembershipResponse{
		MembershipTypeID: membership.MembershipTypeID,
		Name:             membership.Name,
		Description:      membership.Description,
		DurationDays:     membership.DurationDays,
		Price:            membership.Price,
		IsActive:         membership.IsActive,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		List all membership types
// @Description	Retrieves a paginated list of all membership types, with optional searching.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			limit	query		int								false	"Number of results per page"	default(10)
// @Param			page	query		int								false	"Page number for pagination"	default(1)
// @Param			sort	query		string							false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search	query		string							false	"Search term for membership name"
// @Success		200		{object}	object{data=MembershipResponse}	"A paginated list of membership types"
// @Failure		400		{object}	map[string]interface{}			"Bad Request: Invalid query parameters"
// @Failure		500		{object}	object{error=string}			"error: Internal Server Error"
// @Router			/membership-plans [get]
func (h *MembershipHandler) GetMembershipsHandler(c *gin.Context) {
	ctx := c.Request.Context()
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

	nextURL := fmt.Sprintf("/membership-plans?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/membership-plans?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	memberships, err := h.services.MembershipServices.GetMembershipTypes(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]*MembershipResponse, 0, len(memberships))
	for _, m := range memberships {
		data = append(data, &MembershipResponse{
			MembershipTypeID: m.MembershipTypeID,
			Name:             m.Name,
			Description:      m.Description,
			DurationDays:     m.DurationDays,
			Price:            m.Price,
			IsActive:         m.IsActive,
		})
	}
	total, err := h.services.MembershipServices.GetMembershipTypesFTotal(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := pagination.PaginatedResponseTotal[*MembershipResponse]{
		Data:     data,
		Count:    int64(len(memberships)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		Export Membership Types (CSV)
// @Description	Exports all membership types as a CSV file.
// @Tags			Memberships
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Success		200	{file}		file					"membership_plans.csv"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/membership-plans/export [get]
func (h *MembershipHandler) ExportMembershipTypesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit: 1000000,
		Page:  1,
		Sort:  "desc",
	}

	memberships, err := h.services.MembershipServices.GetMembershipTypes(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=membership_plans.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"ID", "Name", "Description", "Duration (Days)", "Price", "Active"})

	for _, m := range memberships {
		writer.Write([]string{
			m.MembershipTypeID.String(),
			m.Name,
			m.Description,
			fmt.Sprintf("%d", m.DurationDays),
			fmt.Sprintf("%.2f", m.Price),
			fmt.Sprintf("%t", m.IsActive),
		})
	}
}

// @Summary		Get a summary of membership types
// @Description	Retrieves a count of total, active, and inactive membership types.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Success		200	{object}	object{data=membershipsdomain.MembershipSummary}	"Summary of membership types"
// @Failure		500	{object}	map[string]interface{}								"Internal Server Error"
// @Router			/membership-plans/summary [get]
func (h *MembershipHandler) GetSummaryMembershipsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	summary, err := h.services.MembershipServices.GetSummary(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": summary})
}

// @Summary		List all public membership types
// @Description	Retrieves a paginated list of all public membership types, with prices converted to a specified currency.
// @Tags			Public
// @Produce		json
// @Param			currency	query		string									false	"The currency to convert prices to (e.g., VES). Defaults to USD."
// @Param			limit		query		int										false	"Number of results per page"	default(10)
// @Param			page		query		int										false	"Page number for pagination"	default(1)
// @Param			sort		query		string									false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search		query		string									false	"Search term for membership name"
// @Success		200			{object}	object{data=[]MembershipPublicResponse}	"A paginated list of public membership types"
// @Failure		400			{object}	map[string]interface{}					"Bad Request: Invalid query parameters"
// @Failure		500			{object}	object{error=string}					"error: Internal Server Error"
// @Router			/public/membership-plans [get]
func (h *MembershipHandler) PublicGetMembershipsTypeHandler(c *gin.Context) {
	ctx := c.Request.Context()

	currency := c.Query("currency")
	if currency == "" {
		currency = "USD"
	}

	rates, err := h.services.BillingServices.GetLatestRates(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	currency_rate := rates[currency]

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

	nextURL := fmt.Sprintf("/public/membership-plans?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/public/membership-plans?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	memberships, err := h.services.MembershipServices.GetMembershipTypes(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]*MembershipPublicResponse, 0, len(memberships))
	for _, m := range memberships {
		data = append(data, &MembershipPublicResponse{
			MembershipTypeID: m.MembershipTypeID,
			Name:             m.Name,
			Description:      m.Description,
			DurationDays:     m.DurationDays,
			Price:            m.Price,
			Base_Currency:    "USD",
			Ref_Price:        decimal.NewFromFloat(float64(m.Price)).Mul(decimal.NewFromFloat(currency_rate)).Round(2),
			Ref_Currency:     currency,
			IsActive:         m.IsActive,
		})
	}
	total, err := h.services.MembershipServices.GetMembershipTypesFTotal(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := pagination.PaginatedResponseTotal[*MembershipPublicResponse]{
		Data:     data,
		Count:    int64(len(memberships)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)

}

// @Summary		Get my membership
// @Description	Retrieves the membership details for the authenticated user.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Success		200	{object}	object{data=membershipsdomain.ClientMembership}	"Client membership details"
// @Failure		404	{object}	map[string]interface{}							"Not Found: Client membership not found"
// @Failure		500	{object}	map[string]interface{}							"Internal Server Error"
// @Router			/client-memberships/me [get]
func (h *MembershipHandler) GetMyMembershipHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	clientMembership, err := h.services.MembershipServices.GetClientMembership(ctx, user.UserID)
	if err != nil {
		if err == shared_errors.ErrNotFound {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": clientMembership})
}

// @Summary		List client memberships
// @Description	Retrieves a paginated list of all client memberships, with optional searching and filtering.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			limit		query		int													false	"Number of results per page"	default(10)
// @Param			page		query		int													false	"Page number for pagination"	default(1)
// @Param			sort		query		string												false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search		query		string												false	"Search term for user name, membership name, or status"
// @Param			category	query		string												false	"Filter by status"	enums(Active, Expired, Cancelled)
// @Success		200			{object}	object{data=[]membershipsdomain.ClientMembership}	"A paginated list of client memberships"
// @Failure		400			{object}	map[string]interface{}								"Bad Request: Invalid query parameters"
// @Failure		500			{object}	map[string]interface{}								"Internal Server Error"
// @Router			/client-memberships [get]
func (h *MembershipHandler) GetClientsMemberships(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit:    10,
		Page:     1,
		Sort:     "desc",
		Search:   "",
		Category: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	clientMemberships, total, err := h.services.MembershipServices.GetClientsMemberships(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := pagination.PaginatedResponseTotal[*membershipsdomain.ClientMembership]{
		Data:  clientMemberships,
		Count: int64(len(clientMemberships)),
		Total: total,
	}
	c.JSON(http.StatusOK, resp)

}

// @Summary		Get client membership by ID
// @Description	Retrieves a single client membership by its UUID.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			clientMembershipId	path		string											true	"Client Membership UUID"
// @Success		200					{object}	object{data=membershipsdomain.ClientMembership}	"Client membership details"
// @Failure		400					{object}	map[string]interface{}							"Bad Request: Invalid ID"
// @Failure		404					{object}	map[string]interface{}							"Not Found: Client membership not found"
// @Failure		500					{object}	map[string]interface{}							"Internal Server Error"
// @Router			/client-memberships/{clientMembershipId} [get]
func (h *MembershipHandler) GetClientMembershipByID(c *gin.Context) {
	ctx := c.Request.Context()
	clientMembershipID, err := uuid.Parse(c.Param("clientMembershipId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	clientMembership, err := h.services.MembershipServices.GetClientMembershipByID(ctx, clientMembershipID)
	if err != nil {
		if err == shared_errors.ErrNotFound {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": clientMembership})
}

// @Summary		Update a client membership
// @Description	Updates a client membership's status and cancellation details.
// @Tags			Memberships
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			clientMembershipId	path		string							true	"Client Membership UUID"
// @Param			payload				body		UpdateClientMembershipPayload	true	"Client membership update payload"
// @Success		200					{object}	object{message=string}			"Client membership updated successfully"
// @Failure		400					{object}	map[string]interface{}			"Bad Request: Invalid ID or payload"
// @Failure		404					{object}	map[string]interface{}			"Not Found: Client membership not found"
// @Failure		500					{object}	map[string]interface{}			"Internal Server Error"
// @Router			/client-memberships/{clientMembershipId} [put]
func (h *MembershipHandler) UpdateClientMembership(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	if user.Role.Name != "client" {
		permission := "members:update"
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

	var payload UpdateClientMembershipPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if payload.Status == string(membershipsdomain.StatusExpired) {
		h.services.LogErrors.BadRequestResponse(c, fmt.Errorf("cannot manually set status to Expired"))
		return
	}

	if user.Role.Name == "client" && payload.Status == string(membershipsdomain.StatusActive) {
		h.services.LogErrors.BadRequestResponse(c, fmt.Errorf("clients cannot activate their own membership"))
		return
	}

	clientMembershipID, err := uuid.Parse(c.Param("clientMembershipId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	membership := &membershipsdomain.ClientMembership{
		ClientMembershipID: clientMembershipID,
		Status:             membershipsdomain.MembershipStatus(payload.Status),
		CancellationNotes:  payload.CancelNotes,
	}

	if payload.CancelReasonID != "" {
		reasonID, err := uuid.Parse(payload.CancelReasonID)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, fmt.Errorf("invalid cancellation_reason_id: %w", err))
			return
		}
		membership.CancellationReasonID = &reasonID
	}

	if err := h.services.MembershipServices.UpdateClientMembershipStatus(ctx, membership); err != nil {
		if err == shared_errors.ErrNotFound {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client membership updated successfully"})
}

// Cancellation Reasons Handlers

// @Summary		Create a new cancellation reason
// @Description	Adds a new standardized cancellation reason for memberships.
// @Tags			Memberships
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			reason	body		CreateCancellationReasonPayload	true	"Cancellation reason creation payload"
// @Success		201		{object}	CancellationReasonResponse		"Cancellation reason created successfully"
// @Failure		400		{object}	object{error=string}			"error: Bad Request"
// @Failure		409		{object}	object{error=string}			"error: Conflict - Description already exists"
// @Failure		500		{object}	object{error=string}			"error: Internal Server Error"
// @Router			/memberships/cancellation-reasons [post]
func (h *MembershipHandler) CreateCancellationReasonHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateCancellationReasonPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	reason := &membershipsdomain.CancellationReason{
		Description: payload.Description,
		IsActive:    payload.IsActive,
	}

	if err := h.services.MembershipServices.CreateCancellationReason(ctx, reason); err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := &CancellationReasonResponse{
		ReasonID:    reason.ReasonID,
		Description: reason.Description,
		IsActive:    reason.IsActive,
	}

	c.JSON(http.StatusCreated, resp)
}

// @Summary		List all cancellation reasons
// @Description	Retrieves all cancellation reasons, ordered alphabetically by description.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			limit	query		int											false	"Number of results per page"	default(10)
// @Param			page	query		int											false	"Page number for pagination"	default(1)
// @Param			sort	query		string										false	"Sort direction (asc/desc)"		enums(asc, desc)	default(asc)
// @Param			search	query		string										false	"Search term"
// @Success		200		{object}	object{data=[]CancellationReasonResponse}	"List of cancellation reasons"
// @Failure		500		{object}	object{error=string}						"error: Internal Server Error"
// @Router			/memberships/cancellation-reasons [get]
func (h *MembershipHandler) GetCancellationReasonsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	if user.Role.Name != "client" {
		permission := "cancellation-reasons:list"
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
		Sort:   "asc",
		Search: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	nextURL := fmt.Sprintf("/memberships/cancellation-reasons?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/memberships/cancellation-reasons?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, previousPage, fq.Sort, fq.Search)

	reasons, total, err := h.services.MembershipServices.GetCancellationReasons(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]*CancellationReasonResponse, 0, len(reasons))
	for _, r := range reasons {
		data = append(data, &CancellationReasonResponse{
			ReasonID:    r.ReasonID,
			Description: r.Description,
			IsActive:    r.IsActive,
		})
	}

	resp := pagination.PaginatedResponseTotal[*CancellationReasonResponse]{
		Data:     data,
		Count:    int64(len(reasons)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		Update a cancellation reason
// @Description	Updates an existing cancellation reason's description and/or active status.
// @Tags			Memberships
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id		path		string							true	"Cancellation Reason UUID"
// @Param			reason	body		UpdateCancellationReasonPayload	true	"Cancellation reason update payload"
// @Success		200		{object}	CancellationReasonResponse		"Cancellation reason updated successfully"
// @Failure		400		{object}	object{error=string}			"error: Bad Request - Invalid ID or payload"
// @Failure		404		{object}	object{error=string}			"error: Not Found - Cancellation reason not found"
// @Failure		409		{object}	object{error=string}			"error: Conflict - Description already exists"
// @Failure		500		{object}	object{error=string}			"error: Internal Server Error"
// @Router			/memberships/cancellation-reasons/{id} [put]
func (h *MembershipHandler) UpdateCancellationReasonHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdateCancellationReasonPayload

	reasonID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	existingReason, err := h.services.MembershipServices.GetCancellationReasonByID(ctx, reasonID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	if payload.Description != "" {
		existingReason.Description = payload.Description
	}
	if payload.IsActive != nil {
		existingReason.IsActive = *payload.IsActive
	}

	if err := h.services.MembershipServices.UpdateCancellationReason(ctx, existingReason); err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := &CancellationReasonResponse{
		ReasonID:    existingReason.ReasonID,
		Description: existingReason.Description,
		IsActive:    existingReason.IsActive,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		Delete a cancellation reason
// @Description	Soft deletes a cancellation reason by setting the deleted_at timestamp.
// @Tags			Memberships
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string					true	"Cancellation Reason UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Cancellation reason not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/memberships/cancellation-reasons/{id} [delete]
func (h *MembershipHandler) DeleteCancellationReasonHandler(c *gin.Context) {
	ctx := c.Request.Context()

	reasonID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.MembershipServices.DeleteCancellationReason(ctx, reasonID); err != nil {
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
