package billinghandlers

import (
	"errors"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Create a new invoice
// @Description	Creates a new invoice for a specific user and branch, containing a list of items. If the user making the request is a client, the invoice is created for them. If the user is staff (with 'billing:create_invoice' permission), the 'user_id' in the payload is required to specify for whom the invoice is being created.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			invoice	body		CreateInvoicePayload						true	"Invoice creation payload"
// @Success		201		{object}	object{message=string,invoice_id=string}	"Invoice created successfully"
// @Failure		400		{object}	object{error=string}						"Bad Request (e.g., invalid payload, missing user_id for staff)"
// @Failure		403		{object}	object{error=string}						"Forbidden (user does not have permission)"
// @Failure		500		{object}	object{error=string}						"Internal Server Error"
// @Router			/billing/invoices [post]
func (h *BillingHandlers) CreateInvoiceHandler(c *gin.Context) {
	var payload CreateInvoicePayload
	ctx := c.Request.Context()
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	var targetUserID uuid.UUID

	if user.Role.Name != "client" {
		permission := "billing:create_invoice"
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
		if payload.UserID == nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required for non-client users"))
			return
		}
		targetUserID = *payload.UserID
	} else {
		targetUserID = user.UserID
	}

	invoice := payload.ToInvoice()
	invoice.UserID = targetUserID

	items := payload.ToInvoiceItems()

	err := h.services.BillingServices.CreateInvoice(ctx, invoice, items)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(201, gin.H{"message": "Invoice created successfully", "invoice_id": invoice.InvoiceID})
}

// @Summary		Get an invoice by ID
// @Description	Retrieves the details of a specific invoice by its UUID. The user must have access to the invoice (either be the owner, a super_admin, or have 'billing:get' permission).
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			invoice_id	path		string							true	"Invoice UUID"
// @Success		200			{object}	object{data=InvoiceResponse}	"Invoice details"
// @Failure		400			{object}	object{error=string}			"Bad Request (e.g., invalid UUID)"
// @Failure		403			{object}	object{error=string}			"Forbidden (user does not have access to this invoice)"
// @Failure		404			{object}	object{error=string}			"Not Found (invoice not found)"
// @Failure		500			{object}	object{error=string}			"Internal Server Error"
// @Router			/billing/invoices/{invoice_id} [get]
func (h *BillingHandlers) GetInvoiceByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	invoiceID, err := uuid.Parse(c.Param("invoice_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	if err := h.services.BillingServices.CheckInvoiceAccess(ctx, user, invoiceID); err != nil {
		switch err {
		case shared_errors.ErrForbidden:
			h.services.LogErrors.ForbiddenResponse(c)
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	invoice, err := h.services.BillingServices.GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	response := NewInvoiceResponse(invoice)
	c.JSON(200, gin.H{"data": response})
}

// @Summary		Add a payment to an invoice
// @Description	Adds a payment to an existing invoice. Clients can only pay their own invoices. Staff with 'billing:process_payment' permission or super admins can add payments to any invoice.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payment	body		CreatePaymentPayload						true	"Payment creation payload"
// @Success		201		{object}	object{message=string,payment_id=string}	"Payment added successfully"
// @Failure		400		{object}	object{error=string}						"Bad Request (e.g., invalid payload, currency not supported)"
// @Failure		403		{object}	object{error=string}						"Forbidden (user does not have permission or is trying to pay another user's invoice)"
// @Failure		404		{object}	object{error=string}						"Not Found (invoice not found)"
// @Failure		500		{object}	object{error=string}						"Internal Server Error"
// @Router			/billing/invoices/payment [post]
func (h *BillingHandlers) AddPaymentToInvoiceHandler(c *gin.Context) {
	var payload CreatePaymentPayload
	ctx := c.Request.Context()
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if !payload.AmountPaid.GreaterThan(decimal.Zero) {
		h.services.LogErrors.BadRequestResponse(c, errors.New("amount_paid must be greater than 0"))
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	if err := h.services.BillingServices.CheckInvoiceAccess(ctx, user, payload.InvoiceID); err != nil {
		switch err {
		case shared_errors.ErrForbidden:
			h.services.LogErrors.ForbiddenResponse(c)
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	payment := payload.ToPayment()

	if user.Role.Name == "client" {
		payment.Status = billingdomain.PaymentStatusPending
	} else {
		payment.Status = billingdomain.PaymentStatusCompleted
	}

	if payload.CurrencyPaid != "USD" {
		rates, err := h.services.BillingServices.GetLatestRates(ctx)
		if err != nil {
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
		rate, ok := rates[payload.CurrencyPaid]
		if !ok {
			h.services.LogErrors.BadRequestResponse(c, errors.New("currency not supported"))
			return
		}

		payment.ExchangeRate = decimal.NewFromFloat(rate)
	} else {
		payment.ExchangeRate = decimal.NewFromInt(1)
	}

	err := h.services.BillingServices.AddPaymentToInvoice(ctx, payment)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(201, gin.H{
		"message":     "Payment added successfully",
		"payment_id":  payment.PaymentID,
		"amount_base": payment.AmountBase,
	})
}

// @Summary		Update a payment's status
// @Description	Updates the status of a specific payment. This is restricted to users with 'billing:process_payment' permission or super admins.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payment_id	path		string					true	"Payment UUID"
// @Param			status		body		UpdatePaymentStatus		true	"New payment status"
// @Success		200			{object}	object{message=string}	"Payment status updated successfully"
// @Failure		400			{object}	object{error=string}	"Bad Request (e.g., invalid UUID or status)"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/payments/{payment_id}/status [patch]
func (h *BillingHandlers) UpdatePaymentStatusHandler(c *gin.Context) {
	var payload UpdatePaymentStatus
	ctx := c.Request.Context()
	err := c.ShouldBindJSON(&payload)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	paymentID, err := uuid.Parse(c.Param("payment_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	payment, err := h.services.BillingServices.GetPaymentByID(ctx, paymentID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	payment.Status = billingdomain.PaymentStatus(payload.Status)
	err = h.services.BillingServices.UpdatePaymentStatus(ctx, payment)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(200, gin.H{
		"message": "Payment status updated successfully",
	})
}

// @Summary		Get a payment by ID
// @Description	Retrieves the details of a specific payment by its UUID. The user must have access to the associated invoice.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			payment_id	path		string							true	"Payment UUID"
// @Success		200			{object}	object{data=PaymentResponse}	"Payment details"
// @Failure		400			{object}	object{error=string}			"Bad Request (e.g., invalid UUID)"
// @Failure		403			{object}	object{error=string}			"Forbidden (user does not have access to this payment's invoice)"
// @Failure		404			{object}	object{error=string}			"Not Found (payment not found)"
// @Failure		500			{object}	object{error=string}			"Internal Server Error"
// @Router			/billing/payments/{payment_id} [get]
func (h *BillingHandlers) GetPaymentByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	paymentID, err := uuid.Parse(c.Param("payment_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	payment, err := h.services.BillingServices.GetPaymentByID(ctx, paymentID)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	if err := h.services.BillingServices.CheckInvoiceAccess(ctx, user, payment.InvoiceID); err != nil {
		switch {
		case errors.Is(err, shared_errors.ErrForbidden):
			h.services.LogErrors.ForbiddenResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	response := NewPaymentResponseFromPayment(payment)
	c.JSON(200, gin.H{"data": response})
}

// @Summary		Get client invoices
// @Description	Retrieves a paginated list of invoices for a specific client. If the authenticated user is a client, it returns their own invoices. If the user is staff with 'billing:list' permission, they can retrieve invoices for any user by providing the user's UUID in the path.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			user_id	path		string									false	"Client UUID (required for staff to view other's invoices)"
// @Param			limit	query		int										false	"Number of results per page"	default(10)
// @Param			page	query		int										false	"Page number for pagination"	default(1)
// @Param			sort	query		string									false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search	query		string									false	"Search term for invoice number or status"
// @Success		200		{object}	object{data=[]ClientInvoiceResponse}	"A paginated list of client invoices"
// @Failure		400		{object}	object{error=string}					"Bad Request (e.g., invalid UUID or query parameters)"
// @Failure		403		{object}	object{error=string}					"Forbidden (user does not have permission)"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/billing/invoices/client [get]
// @Router			/billing/invoices/client/{user_id} [get]
func (h *BillingHandlers) GetClientInvoices(c *gin.Context) {
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

	user := h.services.UserServices.GetUserFromContext(c)
	var targetUserID uuid.UUID

	if user.Role.Name == "client" {
		targetUserID = user.UserID
	} else {
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
		userIDStr := c.Param("user_id")
		if userIDStr == "" {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required for non-client users"))
			return
		}
		targetUserID, err = uuid.Parse(userIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("invalid user_id format"))
			return
		}
	}

	clientInvoices, total, err := h.services.BillingServices.GetClientIvoices(ctx, targetUserID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	invoices := NewClientInvoiceResponse(clientInvoices)

	resp := pagination.PaginatedResponseTotal[ClientInvoiceResponse]{
		Data:     invoices,
		Count:    int64(len(invoices)),
		Total:    total,
		Next:     "",
		Previous: "",
	}

	c.JSON(200, resp)

}

// @Summary		List all invoices
// @Description	Retrieves a paginated list of all invoices in the system, with filtering and search capabilities.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit		query		int										false	"Number of results per page"	default(10)
// @Param			page		query		int										false	"Page number for pagination"	default(1)
// @Param			sort		query		string									false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search		query		string									false	"Search term for invoice number"
// @Param			status		query		string									false	"Filter by invoice status"	enums(Paid, Unpaid, Void, Overdue)
// @Param			branch_id	query		string									false	"Filter by branch UUID"
// @Success		200			{object}	object{data=[]AdminInvoiceListResponse}	"A paginated list of invoices"
// @Failure		400			{object}	object{error=string}					"Bad Request (e.g., invalid query parameters)"
// @Failure		403			{object}	object{error=string}					"Forbidden (user does not have permission)"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/billing/invoices [get]
func (h *BillingHandlers) GetInvoicesHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	if user.Role.Name != "super_admin" {
		ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, "billing:list")
		if err != nil {
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
		if !ok {
			h.services.LogErrors.ForbiddenResponse(c)
			return
		}
	}

	fq, err := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Status: "Unpaid",
	}.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var filterBranchIDs []uuid.UUID
	requestedBranchIDStr := c.Query("branch_id")

	if user.Role.Name == "super_admin" {
		if requestedBranchIDStr != "" {
			id, err := uuid.Parse(requestedBranchIDStr)
			if err != nil {
				h.services.LogErrors.BadRequestResponse(c, errors.New("invalid branch_id"))
				return
			}
			filterBranchIDs = []uuid.UUID{id}
		}
	} else {
		// For non-super_admin, restrict to related branches
		managedBranches, err := h.services.Staff.GetManagedBranches(ctx, user.UserID)
		if err != nil {
			h.services.LogErrors.InternalServerError(c, err)
			return
		}
		staffBranches, err := h.services.Staff.GetStaffBranches(ctx, user.UserID)
		if err != nil {
			h.services.LogErrors.InternalServerError(c, err)
			return
		}

		allowedBranches := make(map[uuid.UUID]bool)
		for _, b := range managedBranches {
			allowedBranches[b.BranchID] = true
		}
		for _, b := range staffBranches {
			allowedBranches[b.BranchID] = true
		}

		if len(allowedBranches) == 0 {
			// User has no related branches, return empty result
			c.JSON(200, pagination.PaginatedResponseTotal[AdminInvoiceListResponse]{
				Data:  []AdminInvoiceListResponse{},
				Count: 0,
				Total: 0,
			})
			return
		}

		if requestedBranchIDStr != "" {
			id, err := uuid.Parse(requestedBranchIDStr)
			if err != nil {
				h.services.LogErrors.BadRequestResponse(c, errors.New("invalid branch_id"))
				return
			}
			if !allowedBranches[id] {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
			filterBranchIDs = []uuid.UUID{id}
		} else {
			for id := range allowedBranches {
				filterBranchIDs = append(filterBranchIDs, id)
			}
		}
	}

	invoices, total, err := h.services.BillingServices.GetInvoices(ctx, fq, filterBranchIDs)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := NewAdminInvoiceListResponse(invoices)

	resp := pagination.PaginatedResponseTotal[AdminInvoiceListResponse]{
		Data:     data,
		Count:    int64(len(data)),
		Total:    total,
		Next:     "",
		Previous: "",
	}

	c.JSON(200, resp)
}

// @Summary		Get tax rate by branch ID
// @Description	Retrieves the tax rate applicable for a specific branch based on its location (Country).
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	path		string					true	"Branch UUID"
// @Success		200			{object}	object{tax_rate=string}	"Tax rate as decimal string"
// @Failure		400			{object}	object{error=string}	"Bad Request"
// @Failure		404			{object}	object{error=string}	"Not Found"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/tax-rate/{branch_id} [get]
func (h *BillingHandlers) GetTaxRateByBranchIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("branch_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	taxRate, err := h.services.BillingServices.GetTaxRateByBranchID(ctx, branchID)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(200, gin.H{"tax_rate": taxRate})
}

// @Summary		Create Checkout Session
// @Description	Creates a Stripe Checkout Session for a specific invoice.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		CreateCheckoutPayload	true	"Checkout payload"
// @Success		200		{object}	object{url=string}		"Checkout URL"
// @Failure		400		{object}	object{error=string}	"Bad Request"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/checkout [post]
func (h *BillingHandlers) CreateCheckoutHandler(c *gin.Context) {
	var payload CreateCheckoutPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	url, err := h.services.BillingServices.CreateCheckoutSessionForInvoice(c.Request.Context(), payload.InvoiceID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(200, gin.H{"url": url})
}

// @Summary		Stripe Webhook
// @Description	Handles Stripe webhooks for payment confirmation.
// @Tags			Billing
// @Accept			json
// @Produce		json
// @Success		200	{object}	nil
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/webhooks/stripe [post]
func (h *BillingHandlers) WebhookHandler(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	signature := c.GetHeader("Stripe-Signature")

	if err := h.services.BillingServices.HandleStripeWebhook(c.Request.Context(), body, signature); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	c.Status(200)
}
