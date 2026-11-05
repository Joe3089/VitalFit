package crmhandlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	crmdomain "github.com/vitalfit/api/internal/modules/crm/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

type FeedbackPayload struct {
	UserID      string `json:"user_id"`
	BranchID    string `json:"branch_id"`
	Type        string `json:"type" binding:"required,oneof=complaint suggestion compliment"`
	Subject     string `json:"subject" binding:"required,max=255"`
	Description string `json:"description" binding:"required,max=5000"`
}

type UpdateFeedbackPayload struct {
	Status          string `json:"status" binding:"required,oneof=open in_progress resolved closed"`
	ResolutionNotes string `json:"resolution_notes" binding:"max=5000"`
}

type TagPayload struct {
	Name  string `json:"name" binding:"required,max=60"`
	Color string `json:"color"`
}

type AssignTagPayload struct {
	TagID string `json:"tag_id" binding:"required,uuid"`
}

type NPSPayload struct {
	Score    *int   `json:"score" binding:"required,min=0,max=10"`
	Comment  string `json:"comment" binding:"max=2000"`
	BranchID string `json:"branch_id"`
	Channel  string `json:"channel"`
}

type ContactPayload struct {
	Name     string `json:"name" binding:"required,max=150"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Phone    string `json:"phone" binding:"max=50"`
	Subject  string `json:"subject" binding:"required,max=255"`
	Message  string `json:"message" binding:"required,max=5000"`
	BranchID string `json:"branch_id"`
}

type StatusPayload struct {
	Status string `json:"status" binding:"required"`
}

func optionalUUID(s string) (*uuid.UUID, error) {
	if s == "" {
		return nil, nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func pageParams(c *gin.Context) (int, int) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if limit < 1 || limit > 100 {
		limit = 10
	}
	if page < 1 {
		page = 1
	}
	return limit, page
}

func (h *CRMHandlers) handleErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, shared_errors.ErrNotFound):
		h.services.LogErrors.NotFoundResponse(c)
	case errors.Is(err, shared_errors.ErrConflict):
		h.services.LogErrors.ConflictResponse(c, err)
	case errors.Is(err, shared_errors.ErrForbidden):
		h.services.LogErrors.ForbiddenResponse(c)
	default:
		h.services.LogErrors.InternalServerError(c, err)
	}
}

// ---------------- Feedback ----------------

// @Summary		List client complaints and suggestions
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Param			status		query	string	false	"open | in_progress | resolved | closed"
// @Param			type		query	string	false	"complaint | suggestion | compliment"
// @Param			user_id		query	string	false	"Client ID"
// @Param			branch_id	query	string	false	"Branch ID"
// @Success		200	{object}	object{data=[]crmdomain.FeedbackView,total=int}
// @Router			/crm/feedback [get]
func (h *CRMHandlers) ListFeedbackHandler(c *gin.Context) {
	limit, page := pageParams(c)
	filter := crmdomain.FeedbackFilter{Status: c.Query("status"), Type: c.Query("type"), Limit: limit, Page: page}
	var err error
	if filter.UserID, err = optionalUUID(c.Query("user_id")); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if filter.BranchID, err = optionalUUID(c.Query("branch_id")); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	rows, total, err := h.services.CRMServices.ListFeedback(c.Request.Context(), filter)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows, "total": total, "page": page, "limit": limit})
}

// @Summary		Register a complaint or suggestion on behalf of a client
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		FeedbackPayload	true	"Feedback (user_id required)"
// @Success		201		{object}	crmdomain.ClientFeedback
// @Router			/crm/feedback [post]
func (h *CRMHandlers) CreateFeedbackHandler(c *gin.Context) {
	var p FeedbackPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	userID, err := uuid.Parse(p.UserID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, errors.New("user_id is required"))
		return
	}
	h.createFeedback(c, userID, p)
}

// @Summary		Submit my own complaint or suggestion
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		FeedbackPayload	true	"Feedback"
// @Success		201		{object}	crmdomain.ClientFeedback
// @Router			/me/feedback [post]
func (h *CRMHandlers) CreateOwnFeedbackHandler(c *gin.Context) {
	var p FeedbackPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	user := h.services.UserServices.GetUserFromContext(c)
	h.createFeedback(c, user.UserID, p)
}

func (h *CRMHandlers) createFeedback(c *gin.Context, userID uuid.UUID, p FeedbackPayload) {
	branchID, err := optionalUUID(p.BranchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	actor := h.services.UserServices.GetUserFromContext(c)
	f := &crmdomain.ClientFeedback{
		UserID:      userID,
		BranchID:    branchID,
		Type:        crmdomain.FeedbackType(p.Type),
		Subject:     p.Subject,
		Description: p.Description,
		CreatedBy:   &actor.UserID,
	}
	if err := h.services.CRMServices.CreateFeedback(c.Request.Context(), f); err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusCreated, f)
}

// @Summary		List my complaints and suggestions
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]crmdomain.FeedbackView,total=int}
// @Router			/me/feedback [get]
func (h *CRMHandlers) ListOwnFeedbackHandler(c *gin.Context) {
	user := h.services.UserServices.GetUserFromContext(c)
	limit, page := pageParams(c)
	rows, total, err := h.services.CRMServices.ListFeedback(c.Request.Context(), crmdomain.FeedbackFilter{UserID: &user.UserID, Limit: limit, Page: page})
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows, "total": total, "page": page, "limit": limit})
}

// @Summary		Update the status of a complaint or suggestion
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Feedback ID"
// @Param			payload	body		UpdateFeedbackPayload	true	"New status"
// @Success		200		{object}	crmdomain.ClientFeedback
// @Router			/crm/feedback/{id} [patch]
func (h *CRMHandlers) UpdateFeedbackHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var p UpdateFeedbackPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	actor := h.services.UserServices.GetUserFromContext(c)
	f, err := h.services.CRMServices.UpdateFeedbackStatus(c.Request.Context(), id, crmdomain.FeedbackStatus(p.Status), p.ResolutionNotes, actor.UserID)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.JSON(http.StatusOK, f)
}

// ---------------- Tags ----------------

// @Summary		List client tags with usage count
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]crmdomain.TagWithCount}
// @Router			/crm/tags [get]
func (h *CRMHandlers) ListTagsHandler(c *gin.Context) {
	tags, err := h.services.CRMServices.ListTags(c.Request.Context())
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

// @Summary		Create a client tag
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		TagPayload	true	"Tag"
// @Success		201		{object}	crmdomain.ClientTag
// @Router			/crm/tags [post]
func (h *CRMHandlers) CreateTagHandler(c *gin.Context) {
	var p TagPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	tag, err := h.services.CRMServices.CreateTag(c.Request.Context(), p.Name, p.Color)
	if err != nil {
		if errors.Is(err, shared_errors.ErrConflict) {
			h.services.LogErrors.ConflictResponse(c, err)
			return
		}
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.JSON(http.StatusCreated, tag)
}

// @Summary		Delete a client tag
// @Tags			CRM
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Tag ID"
// @Success		204
// @Router			/crm/tags/{id} [delete]
func (h *CRMHandlers) DeleteTagHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.CRMServices.DeleteTag(c.Request.Context(), id); err != nil {
		h.handleErr(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// @Summary		Get the tags of a client
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Client ID"
// @Success		200	{object}	object{data=[]crmdomain.ClientTag}
// @Router			/crm/clients/{id}/tags [get]
func (h *CRMHandlers) GetClientTagsHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	tags, err := h.services.CRMServices.GetClientTags(c.Request.Context(), id)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

// @Summary		Assign a tag to a client
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Param			id		path	string				true	"Client ID"
// @Param			payload	body	AssignTagPayload	true	"Tag"
// @Success		204
// @Router			/crm/clients/{id}/tags [post]
func (h *CRMHandlers) AssignTagHandler(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var p AssignTagPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	tagID, _ := uuid.Parse(p.TagID)
	if err := h.services.CRMServices.AssignTag(c.Request.Context(), userID, tagID); err != nil {
		if errors.Is(err, shared_errors.ErrBadRequest) {
			h.services.LogErrors.BadRequestResponse(c, errors.New("tags can only be assigned to clients"))
			return
		}
		h.handleErr(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// @Summary		Remove a tag from a client
// @Tags			CRM
// @Security		ApiKeyAuth
// @Param			id		path	string	true	"Client ID"
// @Param			tagId	path	string	true	"Tag ID"
// @Success		204
// @Router			/crm/clients/{id}/tags/{tagId} [delete]
func (h *CRMHandlers) UnassignTagHandler(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.CRMServices.UnassignTag(c.Request.Context(), userID, tagID); err != nil {
		h.handleErr(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------------- Scoring & segments ----------------

// @Summary		Get the score breakdown of a client
// @Description	Score 0-100: frequency (55%), payment punctuality (45%).
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Client ID"
// @Success		200	{object}	crmdomain.ClientScoreBreakdown
// @Router			/crm/clients/{id}/score [get]
func (h *CRMHandlers) GetClientScoreHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	score, err := h.services.CRMServices.GetClientScore(c.Request.Context(), id)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, score)
}

// @Summary		Client count by segment (VIP, Regular, New, AtRisk)
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string	false	"Branch ID"
// @Success		200			{object}	object{data=[]crmdomain.SegmentCount}
// @Router			/crm/segments [get]
func (h *CRMHandlers) GetSegmentsHandler(c *gin.Context) {
	branchID, err := optionalUUID(c.Query("branch_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	rows, err := h.services.CRMServices.GetSegmentCounts(c.Request.Context(), branchID)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		Recalculate client scores and segments now
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{scored=int,segmented=int}
// @Router			/crm/segments/recalculate [post]
func (h *CRMHandlers) RecalculateSegmentsHandler(c *gin.Context) {
	scored, segmented, err := h.services.CRMServices.RecalculateScoresAndSegments(c.Request.Context())
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"scored": scored, "segmented": segmented})
}

// ---------------- NPS ----------------

// @Summary		Submit a Net Promoter Score answer
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Param			payload	body	NPSPayload	true	"Score 0-10"
// @Success		201
// @Router			/nps [post]
func (h *CRMHandlers) SubmitNPSHandler(c *gin.Context) {
	var p NPSPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := optionalUUID(p.BranchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	user := h.services.UserServices.GetUserFromContext(c)
	r := &crmdomain.NPSResponse{UserID: &user.UserID, BranchID: branchID, Score: *p.Score, Comment: p.Comment, Channel: p.Channel}
	if err := h.services.CRMServices.SubmitNPS(c.Request.Context(), r); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "thank you for your feedback"})
}

// ---------------- Contact ----------------

// @Summary		Send a message from the public contact form
// @Tags			CRM
// @Accept			json
// @Param			payload	body	ContactPayload	true	"Contact message"
// @Success		201
// @Router			/public/contact [post]
func (h *CRMHandlers) SubmitContactHandler(c *gin.Context) {
	var p ContactPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := optionalUUID(p.BranchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	m := &crmdomain.ContactMessage{Name: p.Name, Email: p.Email, Phone: p.Phone, Subject: p.Subject, Message: p.Message, BranchID: branchID}
	if err := h.services.CRMServices.SubmitContactMessage(c.Request.Context(), m); err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "message received"})
}

// @Summary		List contact form messages
// @Tags			CRM
// @Security		ApiKeyAuth
// @Produce		json
// @Param			status	query		string	false	"new | read | answered"
// @Success		200		{object}	object{data=[]crmdomain.ContactMessage,total=int}
// @Router			/crm/contact-messages [get]
func (h *CRMHandlers) ListContactMessagesHandler(c *gin.Context) {
	limit, page := pageParams(c)
	rows, total, err := h.services.CRMServices.ListContactMessages(c.Request.Context(), c.Query("status"), limit, page)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows, "total": total, "page": page, "limit": limit})
}

// @Summary		Update the status of a contact message
// @Tags			CRM
// @Security		ApiKeyAuth
// @Accept			json
// @Param			id		path	string			true	"Message ID"
// @Param			payload	body	StatusPayload	true	"new | read | answered"
// @Success		204
// @Router			/crm/contact-messages/{id} [patch]
func (h *CRMHandlers) UpdateContactMessageHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var p StatusPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.CRMServices.UpdateContactMessageStatus(c.Request.Context(), id, p.Status); err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			h.services.LogErrors.NotFoundResponse(c)
			return
		}
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
