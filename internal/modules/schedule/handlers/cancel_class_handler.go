package schedulehandlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

type CancelClassPayload struct {
	Reason string `json:"reason" binding:"required,min=3,max=1000"`
}

// @Summary		Cancel a scheduled class
// @Description	Cancels the class keeping the reason for traceability. Confirmed bookings are cancelled,
// @Description	consumed credits are refunded and booked clients are notified.
// @Tags			Schedule
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			classId	path		string				true	"Class ID"
// @Param			payload	body		CancelClassPayload	true	"Cancellation reason"
// @Success		200		{object}	object{message=string,affected_bookings=int}
// @Failure		400		{object}	object{error=string}
// @Failure		404		{object}	object{error=string}
// @Router			/schedule/{classId}/cancel [patch]
func (h *ScheduleHandlers) CancelClassHandler(c *gin.Context) {
	classID, err := uuid.Parse(c.Param("classId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload CancelClassPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	user := h.services.UserServices.GetUserFromContext(c)
	class, affected, err := h.services.ScheduleServices.CancelClass(c.Request.Context(), classID, payload.Reason, user.UserID)
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound), errors.Is(err, shared_errors.ErrNotFound):
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.BadRequestResponse(c, err)
		}
		return
	}

	if len(affected) > 0 {
		title := "Clase cancelada"
		message := fmt.Sprintf("La clase de %s del %s fue cancelada. Motivo: %s",
			class.Service.Name, class.StartsAt.Format("02/01 15:04"), payload.Reason)
		notifications := make([]notidomain.Notification, 0, len(affected))
		for _, uid := range affected {
			notifications = append(notifications, notidomain.Notification{
				UserID:   uid,
				Title:    title,
				Message:  message,
				Type:     "class_cancelled",
				Metadata: map[string]interface{}{"class_id": classID.String()},
			})
		}
		go func(users []uuid.UUID) {
			ctx := context.Background()
			if err := h.services.NotificationServices.CreateBatchNotifications(ctx, notifications); err != nil {
				h.services.Logger.Errorw("failed to store class cancellation notifications", "error", err)
			}
			for _, uid := range users {
				if err := h.services.NotificationServices.SendPushNotification(ctx, title, message, uid); err != nil {
					h.services.Logger.Warnw("failed to push class cancellation", "user_id", uid, "error", err)
				}
			}
		}(affected)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":           "class cancelled",
		"affected_bookings": len(affected),
	})
}
