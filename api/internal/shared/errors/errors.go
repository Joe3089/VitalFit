package errors

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var (
	ErrNotFound                 = errors.New("resource not found")
	ErrConflict                 = errors.New("resource already exists")
	ErrInternalServerError      = errors.New("internal server error")
	ErrBadRequest               = errors.New("bad request")
	ErrUnauthorized             = errors.New("unauthorized")
	ErrForbidden                = errors.New("forbidden")
	ErrPayment                  = errors.New("payment required")
	ErrInsufficientBalance      = errors.New("insufficient balance")
	ErrPastClass                = errors.New("cannot book a past class")
	ErrFullClass                = errors.New("class is full")
	ErrCancellationWindowClosed = errors.New("cannot cancel booking within the restricted time window")
	ErrBookingNotActive         = errors.New("booking is not active or was already cancelled")
	ErrClassAlreadyCancelled    = errors.New("class is already cancelled")
	ErrInvalidSession           = errors.New("invalid session or token reused")
	ErrTokenReuse               = errors.New("security alert: token reuse detected, session revoked")
	ErrRefreshTokenMismatch     = errors.New("refresh token mismatch: reuse detection")
)

type LogErrors struct {
	logger *zap.SugaredLogger
}

func NewLogErrors(logger *zap.SugaredLogger) LogErrors {
	return LogErrors{
		logger: logger,
	}
}

func (l *LogErrors) InternalServerError(c *gin.Context, err error) {

	l.logger.Errorw("internal server error", "method", c.Request.Method, "path", c.Request.URL.Path, "error", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "the server encountered a problem"})
}

func (l *LogErrors) BadRequestResponse(c *gin.Context, err error) {
	l.logger.Warnw("bad request error", "method", c.Request.Method, "path", c.Request.URL.Path, "error", err)
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}

func (l *LogErrors) NotFoundResponse(c *gin.Context) {
	l.logger.Warnw("not found error", "method", c.Request.Method, "path", c.Request.URL.Path)
	c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
}

func (l *LogErrors) ConflictResponse(c *gin.Context, err error) {
	l.logger.Errorw("conflict error", "method", c.Request.Method, "path", c.Request.URL.Path, "error", err)
	c.JSON(http.StatusConflict, gin.H{"error": "conflict"})
}

func (l *LogErrors) UnauthorizedBasicErrorResponse(c *gin.Context, err error) {
	l.logger.Errorw("unauthorized basic error", "method", c.Request.Method, "path", c.Request.URL.Path, "error", err)
	c.Header("WWW-Authenticate", `Basic realm="restricted", charset="UTF-8"`)
	c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
}

func (l *LogErrors) ForbiddenResponse(c *gin.Context) {
	l.logger.Warnw("forbidden", "method", c.Request.Method, "path", c.Request.URL.Path)
	c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
}

func (l *LogErrors) UnauthorizedErrorResponse(c *gin.Context, err error) {
	l.logger.Errorw("unauthorized error", "method", c.Request.Method, "path", c.Request.URL.Path, "error", err)
	msg := "unauthorized"
	if err != nil {
		msg = fmt.Sprintf("unauthorized: %s", err.Error())
	}
	c.JSON(http.StatusUnauthorized, gin.H{"error": msg})
}

func (l *LogErrors) PaymentRequiredResponse(c *gin.Context) {
	l.logger.Errorw("PaymentRequired error", "method", c.Request.Method, "path", c.Request.URL.Path)
	c.JSON(http.StatusPaymentRequired, gin.H{"error": "Payment Required"})
}
