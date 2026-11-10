package authhandlers

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
)

type TwoFactorVerifyPayload struct {
	ChallengeID string `json:"challenge_id" binding:"required,uuid"`
	Code        string `json:"code" binding:"required,len=6,numeric"`
}

type TwoFactorResendPayload struct {
	ChallengeID string `json:"challenge_id" binding:"required,uuid"`
}

type SecuritySettingsPayload struct {
	MinLength         int   `json:"min_length" binding:"required,min=6,max=72"`
	RequireUppercase  *bool `json:"require_uppercase" binding:"required"`
	RequireLowercase  *bool `json:"require_lowercase" binding:"required"`
	RequireNumber     *bool `json:"require_number" binding:"required"`
	RequireSpecial    *bool `json:"require_special" binding:"required"`
	ExpirationDays    int   `json:"expiration_days" binding:"min=0,max=3650"`
	TwoFactorRequired *bool `json:"two_factor_required" binding:"required"`
}

// passwordPolicy returns the configured policy, or the defaults when the
// security service is not wired (e.g. handler unit tests).
func (h *AuthHandlers) passwordPolicy(ctx context.Context) authdomain.SecuritySettings {
	if h.services.SecurityServices == nil {
		return authdomain.DefaultSecuritySettings()
	}
	return h.services.SecurityServices.GetSettings(ctx)
}

// validatePassword writes a 400 response and returns false when the password
// does not satisfy the configured policy.
func (h *AuthHandlers) validatePassword(c *gin.Context, password string) bool {
	if err := h.passwordPolicy(c.Request.Context()).ValidatePassword(password); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return false
	}
	return true
}

func (h *AuthHandlers) passwordExpired(ctx context.Context, user *authdomain.Users) bool {
	if h.services.SecurityServices == nil || user.Role.Name == "client" {
		return false
	}
	return h.services.SecurityServices.IsPasswordExpired(ctx, user.UserID)
}

func maskEmail(email string) string {
	at := strings.Index(email, "@")
	if at <= 1 {
		return email
	}
	return email[:1] + strings.Repeat("*", at-1) + email[at:]
}

// issueTokens generates the session tokens and writes the login response.
func (h *AuthHandlers) issueTokens(c *gin.Context, user *authdomain.Users, deviceToken string) {
	ctx := c.Request.Context()
	token, refreshToken, err := h.services.AuthServices.GenerateToken(ctx, user, c.Request.UserAgent(), c.ClientIP(), deviceToken)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := gin.H{
		"token":         token,
		"refresh_token": refreshToken,
	}
	if h.passwordExpired(ctx, user) {
		resp["password_expired"] = true
	}
	c.JSON(http.StatusOK, resp)
}

// @Summary		Verify the two-factor authentication code
// @Description	Completes a dashboard login that returned two_factor_required=true.
// @Tags			Auth
// @Accept			json
// @Produce		json
// @Param			payload	body		TwoFactorVerifyPayload	true	"Challenge and 6-digit code"
// @Success		200		{object}	object{token=string,refresh_token=string,password_expired=bool}
// @Failure		401		{object}	object{error=string}
// @Router			/auth/2fa/verify [post]
func (h *AuthHandlers) VerifyTwoFactorHandler(c *gin.Context) {
	var p TwoFactorVerifyPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	ctx := c.Request.Context()
	challengeID, _ := uuid.Parse(p.ChallengeID)
	ch, err := h.services.SecurityServices.VerifyTwoFactor(ctx, challengeID, p.Code)
	if err != nil {
		if errors.Is(err, authdomain.ErrTwoFactorInvalid) || errors.Is(err, authdomain.ErrTwoFactorAttempts) {
			h.services.LogErrors.UnauthorizedErrorResponse(c, err)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	user, err := h.services.UserServices.GetByID(ctx, ch.UserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	if user.Status == authdomain.UserStatusBlocked {
		h.services.LogErrors.UnauthorizedErrorResponse(c, errors.New("account is blocked"))
		return
	}
	h.issueTokens(c, user, ch.DeviceToken)
}

// @Summary		Resend the two-factor authentication code
// @Tags			Auth
// @Accept			json
// @Param			payload	body	TwoFactorResendPayload	true	"Challenge"
// @Success		204
// @Router			/auth/2fa/resend [post]
func (h *AuthHandlers) ResendTwoFactorHandler(c *gin.Context) {
	var p TwoFactorResendPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	challengeID, _ := uuid.Parse(p.ChallengeID)
	if err := h.services.SecurityServices.ResendTwoFactor(c.Request.Context(), challengeID); err != nil {
		if errors.Is(err, authdomain.ErrTwoFactorInvalid) {
			h.services.LogErrors.UnauthorizedErrorResponse(c, err)
			return
		}
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// @Summary		Get the password policy
// @Description	Public so login/registration forms can show the password rules.
// @Tags			Auth
// @Produce		json
// @Success		200	{object}	authdomain.SecuritySettings
// @Router			/auth/password-policy [get]
func (h *AuthHandlers) GetPasswordPolicyHandler(c *gin.Context) {
	s := h.passwordPolicy(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{
		"min_length":        s.MinLength,
		"require_uppercase": s.RequireUppercase,
		"require_lowercase": s.RequireLowercase,
		"require_number":    s.RequireNumber,
		"require_special":   s.RequireSpecial,
		"expiration_days":   s.ExpirationDays,
	})
}

// @Summary		Get security settings (password policy and 2FA)
// @Tags			Admin
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	authdomain.SecuritySettings
// @Router			/admin/security-settings [get]
func (h *AuthHandlers) GetSecuritySettingsHandler(c *gin.Context) {
	c.JSON(http.StatusOK, h.passwordPolicy(c.Request.Context()))
}

// @Summary		Update security settings (password policy and 2FA)
// @Tags			Admin
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		SecuritySettingsPayload	true	"Settings"
// @Success		200		{object}	authdomain.SecuritySettings
// @Router			/admin/security-settings [put]
func (h *AuthHandlers) UpdateSecuritySettingsHandler(c *gin.Context) {
	var p SecuritySettingsPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	ctx := c.Request.Context()
	actor := h.services.UserServices.GetUserFromContext(c)
	s := &authdomain.SecuritySettings{
		MinLength:         p.MinLength,
		RequireUppercase:  *p.RequireUppercase,
		RequireLowercase:  *p.RequireLowercase,
		RequireNumber:     *p.RequireNumber,
		RequireSpecial:    *p.RequireSpecial,
		ExpirationDays:    p.ExpirationDays,
		TwoFactorRequired: *p.TwoFactorRequired,
	}
	if err := h.services.SecurityServices.UpdateSettings(ctx, s, actor.UserID); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.JSON(http.StatusOK, h.passwordPolicy(ctx))
}
