package billinghandlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

type InvoiceAdjustmentPayload struct {
	DiscountType  string          `json:"discount_type" binding:"required,oneof=Percentage FixedAmount"`
	DiscountValue decimal.Decimal `json:"discount_value" binding:"required"`
	Reason        string          `json:"reason" binding:"required,min=5,max=1000"`
}

// @Summary		Apply a post-sale discount to an invoice
// @Description	Reduces the invoice total keeping full traceability (who, when, why, previous/new total).
// @Description	Capped by the GLOBAL_MAX_DISCOUNT commercial policy (accumulated).
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			invoice_id	path		string						true	"Invoice ID"
// @Param			payload		body		InvoiceAdjustmentPayload	true	"Discount"
// @Success		201			{object}	billingdomain.InvoiceAdjustment
// @Failure		400			{object}	object{error=string}
// @Failure		404			{object}	object{error=string}
// @Router			/billing/invoices/{invoice_id}/adjustments [post]
func (r *BillingHandlers) ApplyInvoiceAdjustmentHandler(c *gin.Context) {
	invoiceID, err := uuid.Parse(c.Param("invoice_id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var p InvoiceAdjustmentPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if p.DiscountValue.LessThanOrEqual(decimal.Zero) {
		r.services.LogErrors.BadRequestResponse(c, errors.New("discount_value must be greater than zero"))
		return
	}
	if p.DiscountType == "Percentage" && p.DiscountValue.GreaterThan(decimal.NewFromInt(100)) {
		r.services.LogErrors.BadRequestResponse(c, errors.New("percentage cannot exceed 100"))
		return
	}
	user := r.services.UserServices.GetUserFromContext(c)
	adj := &billingdomain.InvoiceAdjustment{
		InvoiceID:     invoiceID,
		DiscountType:  p.DiscountType,
		DiscountValue: p.DiscountValue,
		Reason:        p.Reason,
		AppliedBy:     &user.UserID,
	}
	result, err := r.services.BillingServices.ApplyPostSaleDiscount(c.Request.Context(), adj)
	if err != nil {
		switch {
		case errors.Is(err, shared_errors.ErrNotFound):
			r.services.LogErrors.NotFoundResponse(c)
		case errors.Is(err, billingdomain.ErrAdjustmentInvalidInvoice),
			errors.Is(err, billingdomain.ErrAdjustmentExceedsPolicy),
			errors.Is(err, billingdomain.ErrAdjustmentBelowPaid),
			errors.Is(err, shared_errors.ErrBadRequest):
			r.services.LogErrors.BadRequestResponse(c, err)
		default:
			r.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusCreated, result)
}

// @Summary		List post-sale discounts of an invoice
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			invoice_id	path		string	true	"Invoice ID"
// @Success		200			{object}	object{data=[]billingdomain.InvoiceAdjustment}
// @Router			/billing/invoices/{invoice_id}/adjustments [get]
func (r *BillingHandlers) ListInvoiceAdjustmentsHandler(c *gin.Context) {
	invoiceID, err := uuid.Parse(c.Param("invoice_id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	rows, err := r.services.BillingServices.ListInvoiceAdjustments(c.Request.Context(), invoiceID)
	if err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}
