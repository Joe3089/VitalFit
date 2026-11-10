package clientshandler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	clientsdomain "github.com/vitalfit/api/internal/modules/clients/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

// @Summary		Create Medical Information
// @Description	Creates new medical information for a client. Only authorized roles can create medical info.
// @Tags			Clients
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string						true	"Client User ID"
// @Param			payload	body		CreateMedicalInfoPayload	true	"Medical Information Payload"
// @Success		201		{object}	MedicalInfoResponse			"Medical information created successfully"
// @Failure		400		{object}	object{error=string}		"Bad Request"
// @Failure		401		{object}	object{error=string}		"Unauthorized"
// @Failure		403		{object}	object{error=string}		"Forbidden"
// @Failure		409		{object}	object{error=string}		"Conflict - Medical info already exists"
// @Failure		500		{object}	object{error=string}		"Internal Server Error"
// @Router			/clients/{id}/medical-info [post]
func (h *ClientHandler) CreateMedicalInfoHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// Get client user ID from path
	clientIDStr := c.Param("id")
	clientID, err := uuid.Parse(clientIDStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid client ID"))
		return
	}

	// Get current user from context (set by auth middleware)
	user := h.services.UserServices.GetUserFromContext(c)
	if user == nil {
		h.services.LogErrors.UnauthorizedErrorResponse(c, errors.New("user not authenticated"))
		return
	}

	if user.Role.Name != "client" {
		permission := "medical_info:create"
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
	modifiedByUUID := user.UserID
	userRole := user.Role.Name

	// Parse request payload
	var payload CreateMedicalInfoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	// Get IP and User-Agent for audit
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Create medical info data
	data := &clientsdomain.MedicalInfoData{
		MedicalConditions: payload.MedicalConditions,
		MedicalRisks:      payload.MedicalRisks,
		Warnings:          payload.Warnings,
		Allergies:         payload.Allergies,
		Medications:       payload.Medications,
		EmergencyContact:  payload.EmergencyContact,
		BloodType:         payload.BloodType,
	}

	// Create medical info
	_, err = h.services.ClientServices.CreateMedicalInfo(ctx, clientID, modifiedByUUID, userRole, data, ipAddress, userAgent)
	if err != nil {
		if err.Error() == "medical information already exists for this user" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Medical information created successfully",
	})
}

// @Summary		Get Medical Information
// @Description	Retrieves medical information for a specific client. Only authorized roles can view medical info.
// @Tags			Clients
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id	path		string					true	"Client User ID"
// @Success		200	{object}	MedicalInfoResponse		"Medical information retrieved successfully"
// @Failure		400	{object}	object{error=string}	"Bad Request"
// @Failure		401	{object}	object{error=string}	"Unauthorized"
// @Failure		403	{object}	object{error=string}	"Forbidden"
// @Failure		404	{object}	object{error=string}	"Not Found"
// @Failure		500	{object}	object{error=string}	"Internal Server Error"
// @Router			/clients/{id}/medical-info [get]
func (h *ClientHandler) GetMedicalInfoHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// Get client user ID from path
	clientIDStr := c.Param("id")
	clientID, err := uuid.Parse(clientIDStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid client ID"))
		return
	}

	// Get current user from context (set by auth middleware)
	user := h.services.UserServices.GetUserFromContext(c)
	if user == nil {
		h.services.LogErrors.UnauthorizedErrorResponse(c, errors.New("user not authenticated"))
		return
	}

	if user.Role.Name != "client" {
		permission := "medical_info:read"
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
	requestedByUUID := user.UserID
	userRole := user.Role.Name

	// Get IP and User-Agent for audit
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Get medical info
	medicalInfo, err := h.services.ClientServices.GetMedicalInfo(ctx, clientID, requestedByUUID, userRole, ipAddress, userAgent)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "medical information not found"})
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := MedicalInfoResponse{
		MedicalConditions: medicalInfo.MedicalConditions,
		MedicalRisks:      medicalInfo.MedicalRisks,
		Warnings:          medicalInfo.Warnings,
		Allergies:         medicalInfo.Allergies,
		Medications:       medicalInfo.Medications,
		EmergencyContact:  medicalInfo.EmergencyContact,
		BloodType:         medicalInfo.BloodType,
	}

	c.JSON(http.StatusOK, response)
}

// @Summary		Update Medical Information
// @Description	Updates existing medical information for a client. Only authorized roles can update medical info.
// @Tags			Clients
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string						true	"Client User ID"
// @Param			payload	body		UpdateMedicalInfoPayload	true	"Medical Information Update Payload"
// @Success		200		{object}	object{error=string}		"Medical information updated successfully"
// @Failure		400		{object}	object{error=string}		"Bad Request"
// @Failure		401		{object}	object{error=string}		"Unauthorized"
// @Failure		403		{object}	object{error=string}		"Forbidden"
// @Failure		404		{object}	object{error=string}		"Not Found"
// @Failure		500		{object}	object{error=string}		"Internal Server Error"
// @Router			/clients/{id}/medical-info [put]
func (h *ClientHandler) UpdateMedicalInfoHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// Get client user ID from path
	clientIDStr := c.Param("id")
	clientID, err := uuid.Parse(clientIDStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("invalid client ID"))
		return
	}

	// Get current user from context (set by auth middleware)
	user := h.services.UserServices.GetUserFromContext(c)
	if user == nil {
		h.services.LogErrors.UnauthorizedErrorResponse(c, errors.New("user not authenticated"))
		return
	}

	if user.Role.Name != "client" {
		permission := "medical_info:update"
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
	modifiedByUUID := user.UserID
	userRole := user.Role.Name

	// Parse request payload
	var payload UpdateMedicalInfoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	// Get IP and User-Agent for audit
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Create medical info data
	data := &clientsdomain.MedicalInfoData{
		MedicalConditions: payload.MedicalConditions,
		MedicalRisks:      payload.MedicalRisks,
		Warnings:          payload.Warnings,
		Allergies:         payload.Allergies,
		Medications:       payload.Medications,
		EmergencyContact:  payload.EmergencyContact,
		BloodType:         payload.BloodType,
	}

	// Update medical info
	_, err = h.services.ClientServices.UpdateMedicalInfo(ctx, clientID, modifiedByUUID, userRole, data, ipAddress, userAgent)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "medical information not found"})
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Medical information updated successfully",
	})
}
