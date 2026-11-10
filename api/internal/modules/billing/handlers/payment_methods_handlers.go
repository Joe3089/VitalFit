package billinghandlers

import (
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

// @Summary		Get all payment methods
// @Description	Retrieves a list of all available payment methods in the system.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]billingdomain.PaymentMethods}	"A list of available payment methods"
// @Failure		500	{object}	object{error=string}						"Error: internal server error"
// @Router			/billing/payment-methods [get]
func (h *BillingHandlers) GetPaymentMethodsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	paymentMethods, err := h.services.BillingServices.GetPaymentMethods(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": paymentMethods,
	})

}

// @Summary		Export Payment Methods (CSV)
// @Description	Exports all payment methods as a CSV file.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Success		200	{file}		file					"payment_methods.csv"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/payment-methods/export [get]
func (h *BillingHandlers) ExportPaymentMethodsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	paymentMethods, err := h.services.BillingServices.GetPaymentMethods(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=payment_methods.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"ID", "Name", "Type", "Display Name", "Processing Type", "Visibility", "Surcharge Fixed", "Surcharge Percentage", "Global Status"})

	for _, pm := range paymentMethods {
		writer.Write([]string{
			pm.MethodID.String(),
			pm.Name,
			string(pm.Type),
			pm.DisplayName,
			string(pm.ProcessingType),
			string(pm.Visibility),
			strconv.FormatInt(pm.SurchargeFixed, 10),
			fmt.Sprintf("%.2f", pm.SurchargePercentage),
			strconv.FormatBool(pm.GlobalStatus),
		})
	}
}

// @Summary		Create a new payment method
// @Description	Adds a new payment method to the system.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			paymentMethod	body		CreatePaymentMethodPayload	true	"Payment method creation payload"
// @Success		201				{object}	object{message=string}		"payment method created"
// @Failure		400				{object}	object{error=string}		"Bad Request"
// @Failure		500				{object}	object{error=string}		"Internal Server Error"
// @Router			/billing/payment-methods [post]
func (h *BillingHandlers) CreatePaymentMethodHandler(c *gin.Context) {
	var payload CreatePaymentMethodPayload
	ctx := c.Request.Context()
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	paymentMethod := payload.toPaymentMethod()

	if err := h.validateBranchConfig(payload.Configuration, paymentMethod); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	paymentMethod.Configuration = payload.Configuration
	if err := h.services.BillingServices.CreatePaymentMethod(ctx, paymentMethod); err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
			return
		default:
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "payment method created",
	})
}

// @Summary		Update a payment method
// @Description	Updates an existing payment method's details.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id				path		string						true	"Payment Method UUID"
// @Param			paymentMethod	body		UpdatePaymentMethodPayload	true	"Payment method update payload"
// @Success		204				{object}	nil							"No Content"
// @Failure		400				{object}	object{error=string}		"Bad Request"
// @Failure		404				{object}	object{error=string}		"Not Found"
// @Failure		500				{object}	object{error=string}		"Internal Server Error"
// @Router			/billing/payment-methods/{id} [put]
func (h *BillingHandlers) UpdatePaymentMethodHandler(c *gin.Context) {
	ctx := c.Request.Context()
	methodID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload UpdatePaymentMethodPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	paymentMethod := payload.toPaymentMethod()
	if err := h.validateBranchConfig(payload.Configuration, paymentMethod); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	paymentMethod.Configuration = payload.Configuration
	paymentMethod.MethodID = methodID
	err = h.services.BillingServices.UpdatePaymentMethod(ctx, paymentMethod)
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

// @Summary		Delete a payment method
// @Description	Deletes a payment method from the system.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Payment Method UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		404	{object}	object{error=string}	"Not Found"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/payment-methods/{id} [delete]
func (h *BillingHandlers) DeletePaymentMethodHandler(c *gin.Context) {
	ctx := c.Request.Context()
	methodID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.BillingServices.DeletePaymentMethod(ctx, methodID)
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

// @Summary		Get payment method by ID
// @Description	Retrieves a single payment method by its UUID.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string										true	"Payment Method UUID"
// @Success		200	{object}	object{data=billingdomain.PaymentMethods}	"Payment method details"
// @Failure		400	{object}	object{error=string}						"Bad Request"
// @Failure		404	{object}	object{error=string}						"Not Found"
// @Failure		500	{object}	object{error=string}						"Internal Server Error"
// @Router			/billing/payment-methods/{id} [get]
func (h *BillingHandlers) GetPaymentMethodByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, "billing:get")
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

	methodID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	paymentMethod, err := h.services.BillingServices.GetPaymentMethodByID(ctx, methodID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
}

// @Summary		Add payment methods to a branch
// @Description	Assigns one or more payment methods to a specific branch with custom configurations.
// @Tags			Branch Payment Methods
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string						true	"Branch UUID"
// @Param			payload	body		MethodBranchConfigPayload	true	"An array of payment method configurations to add to the branch"
// @Success		201		{object}	object{message=string}		"Payment methods added to branch"
// @Failure		400		{object}	object{error=string}		"Bad Request (e.g., invalid UUID, invalid payload)"
// @Failure		404		{object}	object{error=string}		"Not Found (e.g., branch or payment method not found)"
// @Failure		500		{object}	object{error=string}		"Internal Server Error"
// @Router			/branches/{id}/payment-methods [post]
func (h *BillingHandlers) AddPaymentMethodsToBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid branch id"))
		return
	}

	var payload MethodBranchConfigPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if len(payload.MethodID) == 0 {
		h.services.LogErrors.BadRequestResponse(c, errors.New("payload array cannot be empty"))
		return
	}

	branchMethods := make([]*billingdomain.PaymentMethodsBranch, 0, len(payload.MethodID))

	for _, methodIDStr := range payload.MethodID {
		methodID, err := uuid.Parse(methodIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("invalid method id: "+methodIDStr))
			return
		}

		branchMethod := &billingdomain.PaymentMethodsBranch{
			BranchID: branchID,
			MethodID: methodID,
			IsActive: true,
		}
		branchMethods = append(branchMethods, branchMethod)
	}

	err = h.services.BillingServices.AddPaymentMethodsToBranch(ctx, branchMethods)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Payment methods added to branch"})
}

// @Summary		Remove a payment method from a branch
// @Description	Removes a specific payment method configuration from a specific branch.
// @Tags			Branch Payment Methods
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id			path	string	true	"Branch UUID"
// @Param			method_id	path	string	true	"Payment Method UUID"
// @Success		204			"No Content"
// @Failure		400			{object}	object{error=string}	"Bad Request (e.g., invalid UUID)"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/branches/{id}/payment-methods/{method_id} [delete]
func (h *BillingHandlers) DeletePaymentMethodsFromBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	methodID, err := uuid.Parse(c.Param("method_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.BillingServices.DeletePaymentMethodsFromBranch(ctx, branchID, methodID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)

}

// @Summary		List payment methods for a branch
// @Description	Retrieves all payment methods configured for a specific branch.
// @Tags			Branch Payment Methods
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Branch UUID"
// @Success		200	{object}	object{data=[]BranchPaymentMethodResponse}
// @Failure		400	{object}	object{error=string}	"Bad Request (e.g., invalid UUID)"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/branches/{id}/payment-methods [get]
func (h *BillingHandlers) GetPaymentMethodsFromBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		permission := "billing:list"
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
	Branchmethods, err := h.services.BillingServices.GetPaymentMethodsFromBranch(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return

	}
	resp := make([]BranchPaymentMethodResponse, 0, len(Branchmethods))
	for _, method := range Branchmethods {
		if method.Method == nil {
			continue
		}
		resp = append(resp, BranchPaymentMethodResponse{
			BranchID: method.BranchID,
			MethodID: method.MethodID,
			Name:     method.Method.Name,
			Type:     string(method.Method.Type),
			IsActive: method.IsActive,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})

}

// @Summary		Update a branch payment method configuration
// @Description	Updates the configuration of a specific payment method for a specific branch.
// @Tags			Branch Payment Methods
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id			path		string						true	"Branch UUID"
// @Param			method_id	path		string						true	"Payment Method UUID"
// @Param			payload		body		UpdateBranchConfigPayload	true	"Configuration update payload"
// @Success		200			{object}	object{message=string}		"Payment method configuration updated"
// @Failure		400			{object}	object{error=string}		"Bad Request (e.g., invalid UUID, invalid payload)"
// @Failure		404			{object}	object{error=string}		"Not Found (e.g., payment method not found)"
// @Failure		500			{object}	object{error=string}		"Internal Server Error"
// @Router			/branches/{id}/payment-methods/{method_id} [put]
func (h *BillingHandlers) UpdatePaymentMethodFromBranchHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid branch id"))
		return
	}
	methodID, err := uuid.Parse(c.Param("method_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid method id"))
		return
	}

	var payload UpdateBranchConfigPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if payload.IsActive != "" {
		isActive, err := strconv.ParseBool(payload.IsActive)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
		payload.IsActive = strconv.FormatBool(isActive)
	}
	methodStatus, err := strconv.ParseBool(payload.IsActive)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	branchMethod := &billingdomain.PaymentMethodsBranch{
		BranchID: branchID,
		MethodID: methodID,
		IsActive: methodStatus,
	}

	err = h.services.BillingServices.UpsertBranchPaymentConfig(ctx, branchMethod)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment method configuration updated"})
}

// @Summary		Get branch payment method by ID
// @Description	Retrieves a single payment method configuration for a specific branch by its UUID and the method's UUID.
// @Tags			Branch Payment Methods
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id			path		string	true	"Branch UUID"
// @Param			method_id	path		string	true	"Payment Method UUID"
// @Success		200			{object}	object{data=BranchPaymentMethodResponse}
// @Failure		400			{object}	object{error=string}	"Error: Bad Request (e.g., invalid UUID)"
// @Failure		404			{object}	object{error=string}	"Error: Not Found"
// @Failure		500			{object}	object{error=string}	"Error: Internal Server Error"
// @Router			/branches/{id}/payment-methods/{method_id} [get]
func (h *BillingHandlers) GetBranchPaymentMethodByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	if user.Role.Name != "client" {
		permission := "billing:get"
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
	methodID, err := uuid.Parse(c.Param("method_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchMethod, err := h.services.BillingServices.GetBranchPaymentMethodByID(ctx, branchID, methodID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := BranchPaymentMethodResponse{
		BranchID: branchMethod.BranchID,
		MethodID: branchMethod.MethodID,
		Name:     branchMethod.Method.Name,
		Type:     string(branchMethod.Method.Type),
		IsActive: branchMethod.IsActive,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}
