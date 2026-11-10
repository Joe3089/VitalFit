package audithandlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	auditdomain "github.com/vitalfit/api/internal/modules/audit/domain"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Get user audit logs
// @Description	Retrieves a paginated list of audit logs for a specific user.
// @Tags			Audit
// @Security		ApiKeyAuth
// @Produce		json
// @Param			userId	path		string								true	"User UUID"
// @Param			limit	query		int									false	"Number of results per page"	default(10)
// @Param			page	query		int									false	"Page number"					default(1)
// @Param			sort	query		string								false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search	query		string								false	"Search term for path or method"
// @Success		200		{object}	object{data=[]auditdomain.AuditLog}	"Paginated audit logs"
// @Failure		400		{object}	object{error=string}				"Bad Request"
// @Failure		500		{object}	object{error=string}				"Internal Server Error"
// @Router			/audit-logs/user/{userId} [get]
func (h *AuditHandlers) GetUserLogsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	userID := c.Param("userId")

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	logs, total, err := h.services.AuditServices.GetUserLogs(ctx, userID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	nextURL := fmt.Sprintf("/audit-logs/user/%s?limit=%d&page=%d&sort=%s", userID, fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/audit-logs/user/%s?limit=%d&page=%d&sort=%s", userID, fq.Limit, previousPage, fq.Sort)

	resp := pagination.PaginatedResponseTotal[*auditdomain.AuditLog]{
		Data:     logs,
		Count:    int64(len(logs)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		Get all audit logs
// @Description	Retrieves a paginated list of all audit logs.
// @Tags			Audit
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int									false	"Number of results per page"	default(10)
// @Param			page	query		int									false	"Page number"					default(1)
// @Param			sort	query		string								false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search	query		string								false	"Search term for path or method"
// @Success		200		{object}	object{data=[]auditdomain.AuditLog}	"Paginated audit logs"
// @Failure		400		{object}	object{error=string}				"Bad Request"
// @Failure		500		{object}	object{error=string}				"Internal Server Error"
// @Router			/audit-logs [get]
func (h *AuditHandlers) GetAllLogsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	logs, total, err := h.services.AuditServices.GetAllLogs(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	nextURL := fmt.Sprintf("/audit-logs?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage < 1 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/audit-logs?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	resp := pagination.PaginatedResponseTotal[*auditdomain.AuditLog]{
		Data:     logs,
		Count:    int64(len(logs)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}
