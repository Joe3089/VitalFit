package billinghandlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Create a new fiscal document type
// @Description	Adds a new fiscal document type to the system.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			fiscalDocumentType	body		CreateFiscalDocumentTypePayload	true	"Fiscal document type creation payload"
// @Success		201					{object}	object{message=string}			"Fiscal document type created successfully"
// @Failure		400					{object}	object{error=string}			"Bad Request"
// @Failure		409					{object}	object{error=string}			"Conflict"
// @Failure		500					{object}	object{error=string}			"Internal Server Error"
// @Router			/billing/fiscal-document-types [post]
func (h *BillingHandlers) CreateFiscalDocumentTypeHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateFiscalDocumentTypePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	fiscalDocumentType := payload.ToFiscalDocumentType()
	err := h.services.BillingServices.CreateFiscalDocumentType(ctx, fiscalDocumentType)
	if err != nil {
		if err == shared_errors.ErrConflict {
			h.services.LogErrors.ConflictResponse(c, err)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Fiscal document type created successfully"})
}

// @Summary		Get all fiscal document types
// @Description	Retrieves a list of all available fiscal document types in the system.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int		false	"Number of results per page"	default(10)
// @Param			page	query		int		false	"Page number for pagination"	default(1)
// @Param			sort	query		string	false	"Sort order (asc/desc)"			Enums(asc, desc)	default(desc)
// @Param			search	query		string	false	"Search term for document name"
// @Success		200		{object}	object{data=FiscalDocumentTypeResponse}
// @Failure		400		{object}	object{error=string}	"Bad Request"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/fiscal-document-types [get]
func (h *BillingHandlers) GetFiscalDocumentTypesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Page:   1,
		Limit:  10,
		Sort:   "asc",
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	nextURL := fmt.Sprintf("/billing/fiscal-document-types?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/billing/fiscal-document-types?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	fiscalDocumentTypes, err := h.services.BillingServices.GetFiscalDocumentTypes(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	data := make([]FiscalDocumentTypeResponse, len(fiscalDocumentTypes))
	for i, docType := range fiscalDocumentTypes {
		data[i] = *NewFiscalDocumentTypeResponse(docType)
	}
	total, err := h.services.BillingServices.GetFiscalDocumentTypesTotal(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := pagination.PaginatedResponseTotal[FiscalDocumentTypeResponse]{
		Data:     data,
		Count:    int64(len(data)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		Get fiscal document type by ID
// @Description	Retrieves a single fiscal document type by its UUID.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Fiscal Document Type UUID"
// @Success		200	{object}	object{data=FiscalDocumentTypeResponse}
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		404	{object}	object{error=string}	"Not Found"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/fiscal-document-types/{id} [get]
func (h *BillingHandlers) GetFiscalDocumentTypeByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fiscalDocumentTypeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	fiscalDocumentType, err := h.services.BillingServices.GetFiscalDocumentTypeByID(ctx, fiscalDocumentTypeID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		if err == shared_errors.ErrNotFound {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return

	}
	resp := NewFiscalDocumentTypeResponse(fiscalDocumentType)
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		Update a fiscal document type
// @Description	Updates an existing fiscal document type's details.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string							true	"Fiscal Document Type UUID"
// @Param			payload	body		UpdateFiscalDocumentTypePayload	true	"Fiscal document type update payload"
// @Success		200		{object}	object{message=string}			"Fiscal document type updated successfully"
// @Failure		400		{object}	object{error=string}			"Bad Request"
// @Failure		500		{object}	object{error=string}			"Internal Server Error"
// @Router			/billing/fiscal-document-types/{id} [put]
func (h *BillingHandlers) UpdateFiscalDocumentTypeHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fiscalDocumentTypeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload UpdateFiscalDocumentTypePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	fiscalDocumentType := payload.ToFiscalDocumentType()
	fiscalDocumentType.DocumentTypeID = fiscalDocumentTypeID
	err = h.services.BillingServices.UpdateFiscalDocumentType(ctx, fiscalDocumentType)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Fiscal document type updated successfully"})
}

// @Summary		Delete a fiscal document type
// @Description	Deletes a fiscal document type from the system.
// @Tags			Billing
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Fiscal Document Type UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/billing/fiscal-document-types/{id} [delete]
func (h *BillingHandlers) DeleteFiscalDocumentTypeHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fiscalDocumentTypeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.BillingServices.DeleteFiscalDocumentType(ctx, fiscalDocumentTypeID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
