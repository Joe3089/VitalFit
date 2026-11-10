package auth

import (
	"bytes"
	"context"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	auditdomain "github.com/vitalfit/api/internal/modules/audit/domain"
)

func (j *AuthMiddleware) AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		method := c.Request.Method
		if method == "GET" || method == "OPTIONS" || method == "HEAD" {
			c.Next()
			return
		}

		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		c.Next()

		status := c.Writer.Status()
		if status >= 300 {
			return
		}

		var userID *uuid.UUID

		userCtx := j.services.UserServices.GetUserFromContext(c)
		if userCtx != nil {
			if userCtx.Role.Name == "client" {
				return
			}
			userID = &userCtx.UserID
		}

		if userID == nil {
			return
		}

		path := c.Request.URL.Path
		userAgent := c.Request.UserAgent()
		ip := c.ClientIP()
		payloadStr := string(requestBody)
		if payloadStr == "" {
			payloadStr = "{}"
		}

		go func(uID uuid.UUID, m, p, ua, ipAddr, load string, st int) {
			ctx := context.Background()
			err := j.services.AuditServices.CreateLog(ctx, &auditdomain.AuditLog{
				UserID:    &uID,
				Method:    m,
				Path:      p,
				Status:    st,
				Payload:   load,
				UserAgent: ua,
				IPAddress: ipAddr,
			})
			if err != nil {
				j.services.Logger.Errorw("failed to create audit log", "error", err)
			}
		}(*userID, method, path, userAgent, ip, payloadStr, status)
	}
}
