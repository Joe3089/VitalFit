package notihandlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Get user notifications
// @Description	Retrieves a paginated list of notifications for the authenticated user.
// @Tags			Notifications
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int									false	"Number of results per page"	default(10)
// @Param			page	query		int									false	"Page number for pagination"	default(1)
// @Param			sort	query		string								false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Success		200		{object}	object{data=[]NotificationResponse}	"List of notifications"
// @Failure		400		{object}	map[string]interface{}				"Bad Request"
// @Failure		500		{object}	map[string]interface{}				"Internal Server Error"
// @Router			/notifications [get]
func (h *NotificationHandlers) GetNotificationsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	fq := pagination.PaginatedFeedQuery{
		Limit: 10,
		Page:  1,
		Sort:  "desc",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	notifications, err := h.services.NotificationServices.GetNotificationsByUserID(ctx, user.UserID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]NotificationResponse, len(notifications))
	for i, n := range notifications {
		response[i] = NewNotificationResponse(n)
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		Get unread notifications count
// @Description	Retrieves the count of unread notifications for the authenticated user.
// @Tags			Notifications
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	UnreadCountResponse		"Count of unread notifications"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/notifications/unread-count [get]
func (h *NotificationHandlers) GetUnreadCountHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	count, err := h.services.NotificationServices.CountUnread(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, UnreadCountResponse{Count: count})
}

// @Summary		Mark notification as read
// @Description	Marks a specific notification as read.
// @Tags			Notifications
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Notification UUID"
// @Success		204	{object}	nil						"Notification marked as read"
// @Failure		400	{object}	map[string]interface{}	"Bad Request: Invalid UUID"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/notifications/{id}/read [patch]
func (h *NotificationHandlers) MarkAsReadHandler(c *gin.Context) {
	ctx := c.Request.Context()
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.NotificationServices.MarkAsRead(ctx, id)
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

// @Summary		Mark all notifications as read
// @Description	Marks all notifications for the authenticated user as read.
// @Tags			Notifications
// @Security		ApiKeyAuth
// @Produce		json
// @Success		204	{object}	nil						"All notifications marked as read"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/notifications/read-all [patch]
func (h *NotificationHandlers) MarkAllAsReadHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	err := h.services.NotificationServices.MarkAllAsRead(ctx, user.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Send broadcast notification
// @Description	Sends a push notification to all users.
// @Tags			Notifications
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		BroadcastRequest		true	"Broadcast payload"
// @Success		200		{object}	map[string]interface{}	"Notification sent"
// @Failure		400		{object}	map[string]interface{}	"Bad Request"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/notifications/broadcast [post]
func (h *NotificationHandlers) SendBroadcastHandler(c *gin.Context) {
	var payload BroadcastRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	ctx := c.Request.Context()
	if err := h.services.NotificationServices.SendBroadcast(ctx, payload.Title, payload.Message); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Notification sent"})
}
