package policieshandler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	policiesdomain "github.com/vitalfit/api/internal/modules/policies/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

// @Summary		Update a policy
// @Description	Updates an existing policy's value.
// @Tags			Policies
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Policy UUID"
// @Param			policy	body		UpdatePolicyValue		true	"Payload with value to update"
// @Success		204		{object}	nil						"Policy updated successfully"
// @Failure		400		{object}	map[string]interface{}	"Bad Request: Invalid UUID or payload"
// @Failure		404		{object}	map[string]interface{}	"Not Found: Policy not found"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/policies/{id} [put]
func (h *PoliciesHandler) UpdatePolicyHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdatePolicyValue
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	policyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	policy := &policiesdomain.CommercialPolicy{
		ID:    policyID,
		Value: payload.Value,
	}

	err = h.services.Policies.UpdatePolicy(ctx, policy)
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

// @Summary		List all policies
// @Description	Retrieves a list of all commercial policies.
// @Tags			Policies
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]PolicyResponse}	"List of policies"
// @Failure		500	{object}	map[string]interface{}			"Internal server error"
// @Router			/policies [get]
func (h *PoliciesHandler) GetPoliciesListHandler(c *gin.Context) {
	ctx := c.Request.Context()
	policies, err := h.services.Policies.GetPoliciesList(ctx, nil)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]PolicyResponse, 0, len(policies))
	for _, p := range policies {
		response = append(response, PolicyResponse{
			ID:          p.ID.String(),
			Name:        p.DisplayName,
			Description: p.Description,
			Value:       p.Value,
			Category:    p.PolicyKey,
			Active:      p.IsActive,
			DataType:    p.DataType,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		Get policy by ID
// @Description	Retrieves detailed information about a specific policy by its UUID.
// @Tags			Policies
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string						true	"Policy UUID"
// @Success		200	{object}	object{data=PolicyResponse}	"Policy details"
// @Failure		400	{object}	map[string]interface{}		"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}		"Not Found: Policy not found"
// @Failure		500	{object}	map[string]interface{}		"Internal Server Error"
// @Router			/policies/{id} [get]
func (h *PoliciesHandler) GetPolicyByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	policyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	policy, err := h.services.Policies.GetPolicyByID(ctx, policyID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	response := PolicyResponse{
		ID:          policy.ID.String(),
		Name:        policy.DisplayName,
		Description: policy.Description,
		Value:       policy.Value,
		Category:    policy.PolicyKey,
		Active:      policy.IsActive,
		DataType:    policy.DataType,
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}
