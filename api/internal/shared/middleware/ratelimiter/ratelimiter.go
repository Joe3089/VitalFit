package ratelimiter

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vitalfit/api/pkg/ratelimiter"
	"go.uber.org/zap"
)

type RateLimiterMiddleware struct {
	rateLimiter ratelimiter.Limiter
	cfg         ratelimiter.Config
	logger      *zap.SugaredLogger
}

func NewRateLimiterMiddleware(rateLimiter ratelimiter.Limiter, cfg ratelimiter.Config, logger *zap.SugaredLogger) *RateLimiterMiddleware {
	return &RateLimiterMiddleware{
		rateLimiter: rateLimiter,
		cfg:         cfg,
		logger:      logger,
	}
}

func (r *RateLimiterMiddleware) RateLimiterMiddleware() gin.HandlerFunc {
	if !r.cfg.Enabled {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		if allow, retryAfter := r.rateLimiter.Allow(clientIP); !allow {

			r.logger.Warnw("rate limit exceeded",
				"client_ip", clientIP,
				"method", c.Request.Method,
				"path", c.Request.URL.Path,
				"retry_after_duration", retryAfter.String(),
			)

			retryAfterSeconds := int(retryAfter / time.Second)

			c.Header("Retry-After", retryAfter.String())

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"status":              "error",
				"message":             "Too many requests. Please try again later.",
				"retry_after_seconds": retryAfterSeconds,
			})
			return
		}

		c.Next()
	}
}
