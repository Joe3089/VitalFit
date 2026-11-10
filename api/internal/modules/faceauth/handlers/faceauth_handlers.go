package faceauthhandlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary		Enroll Face
// @Description	Registers a face for the authenticated user.
// @Tags			FaceAuth
// @Security		ApiKeyAuth
// @Accept			multipart/form-data
// @Produce		json
// @Param			selfie	formData	file	true	"User selfie image"
// @Success		200		{object}	map[string]string
// @Failure		400		{object}	map[string]interface{}
// @Failure		500		{object}	map[string]interface{}
// @Router			/face-auth/enroll [post]
func (h *FaceAuthHandler) EnrollFaceHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)

	// Limit upload size (e.g., 10MB)
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	file, _, err := c.Request.FormFile("selfie")
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	if err := h.services.FaceAuthServices.EnrollFace(ctx, user.UserID, fileBytes); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Face recognition successfully activated"})
}
