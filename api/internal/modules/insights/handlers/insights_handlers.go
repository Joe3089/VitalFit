package insightshandlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	insightsdomain "github.com/vitalfit/api/internal/modules/insights/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
)

const dateLayout = "2006-01-02"

// dateRange reads start/end (YYYY-MM-DD, end inclusive). Defaults to the last 30 days.
func dateRange(c *gin.Context) (insightsdomain.DateRange, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	r := insightsdomain.DateRange{Start: today.AddDate(0, 0, -29), End: today.AddDate(0, 0, 1)}
	if s := c.Query("start"); s != "" {
		t, err := time.ParseInLocation(dateLayout, s, now.Location())
		if err != nil {
			return r, fmt.Errorf("invalid start date, use YYYY-MM-DD")
		}
		r.Start = t
	}
	if e := c.Query("end"); e != "" {
		t, err := time.ParseInLocation(dateLayout, e, now.Location())
		if err != nil {
			return r, fmt.Errorf("invalid end date, use YYYY-MM-DD")
		}
		r.End = t.AddDate(0, 0, 1)
	}
	if !r.End.After(r.Start) {
		return r, errors.New("end must be on or after start")
	}
	if r.End.Sub(r.Start) > 366*24*time.Hour {
		return r, errors.New("the maximum range is one year")
	}
	return r, nil
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

func (h *InsightsHandlers) fail(c *gin.Context, err error) {
	switch {
	case errors.Is(err, shared_errors.ErrNotFound):
		h.services.LogErrors.NotFoundResponse(c)
	case errors.Is(err, shared_errors.ErrConflict):
		h.services.LogErrors.ConflictResponse(c, err)
	case errors.Is(err, insightsdomain.ErrInvalidFormat), errors.Is(err, insightsdomain.ErrInvalidReportType):
		h.services.LogErrors.BadRequestResponse(c, err)
	default:
		h.services.LogErrors.InternalServerError(c, err)
	}
}

func (h *InsightsHandlers) branchAndRange(c *gin.Context) (*uuid.UUID, insightsdomain.DateRange, bool) {
	r, err := dateRange(c)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return nil, r, false
	}
	branchID, err := optionalUUID(c.Query("branch_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return nil, r, false
	}
	return branchID, r, true
}

// ---------------- Web events ----------------

type WebEventPayload struct {
	SessionID string `json:"session_id" binding:"required,min=8,max=64"`
	EventType string `json:"event_type" binding:"required,oneof=visit signup checkout purchase"`
	Path      string `json:"path" binding:"max=255"`
}

// @Summary		Track an e-commerce funnel event
// @Description	Anonymous tracking used to compute the web conversion rate.
// @Tags			Insights
// @Accept			json
// @Param			payload	body	WebEventPayload	true	"Event"
// @Success		202
// @Router			/public/web-events [post]
func (h *InsightsHandlers) TrackWebEventHandler(c *gin.Context) {
	var p WebEventPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.InsightsServices.TrackWebEvent(c.Request.Context(), p.SessionID, p.EventType, p.Path, nil); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.Status(http.StatusAccepted)
}

// ---------------- Analytics ----------------

// @Summary		Web conversion rate
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string	false	"YYYY-MM-DD (default: 30 days ago)"
// @Param			end		query		string	false	"YYYY-MM-DD (default: today)"
// @Success		200		{object}	insightsdomain.ConversionStats
// @Router			/insights/conversion [get]
func (h *InsightsHandlers) GetConversionHandler(c *gin.Context) {
	r, err := dateRange(c)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	stats, err := h.services.InsightsServices.GetConversionStats(c.Request.Context(), r)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, stats)
}

// @Summary		Net Promoter Score summary
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string	false	"YYYY-MM-DD"
// @Param			end		query		string	false	"YYYY-MM-DD"
// @Success		200		{object}	insightsdomain.NPSSummary
// @Router			/insights/nps [get]
func (h *InsightsHandlers) GetNPSHandler(c *gin.Context) {
	r, err := dateRange(c)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	s, err := h.services.InsightsServices.GetNPSSummary(c.Request.Context(), r)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, s)
}

// @Summary		Revenue per available space (RevPAS)
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start		query		string	false	"YYYY-MM-DD"
// @Param			end			query		string	false	"YYYY-MM-DD"
// @Param			branch_id	query		string	false	"Branch ID"
// @Success		200			{object}	insightsdomain.RevPASReport
// @Router			/insights/revpas [get]
func (h *InsightsHandlers) GetRevPASHandler(c *gin.Context) {
	branchID, r, ok := h.branchAndRange(c)
	if !ok {
		return
	}
	rep, err := h.services.InsightsServices.GetRevPAS(c.Request.Context(), r, branchID)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, rep)
}

// @Summary		Automatic benchmarking between branches
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string	false	"YYYY-MM-DD"
// @Param			end		query		string	false	"YYYY-MM-DD"
// @Success		200		{object}	insightsdomain.BenchmarkReport
// @Router			/insights/benchmark [get]
func (h *InsightsHandlers) GetBenchmarkHandler(c *gin.Context) {
	r, err := dateRange(c)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	rep, err := h.services.InsightsServices.GetBenchmark(c.Request.Context(), r)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, rep)
}

// @Summary		Clients at risk of churn (predictive score)
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string	false	"Preferred branch"
// @Param			min_score	query		int		false	"Minimum risk score 0-100 (default 40)"
// @Success		200			{object}	object{data=[]reportdomain.ChurnRiskAnalysis}
// @Router			/insights/churn-risk [get]
func (h *InsightsHandlers) GetChurnRiskHandler(c *gin.Context) {
	branchID, err := optionalUUID(c.Query("branch_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	minScore, err := strconv.Atoi(c.DefaultQuery("min_score", "40"))
	if err != nil || minScore < 0 || minScore > 100 {
		h.services.LogErrors.BadRequestResponse(c, errors.New("min_score must be between 0 and 100"))
		return
	}
	rows, err := h.services.ReportServices.ListChurnRisk(c.Request.Context(), branchID, minScore)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// ---------------- Alerts ----------------

// @Summary		KPI anomaly alerts
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Param			open		query		bool	false	"Only unacknowledged (default true)"
// @Param			branch_id	query		string	false	"Branch ID"
// @Success		200			{object}	object{data=[]insightsdomain.KPIAlert}
// @Router			/insights/alerts [get]
func (h *InsightsHandlers) ListAlertsHandler(c *gin.Context) {
	branchID, err := optionalUUID(c.Query("branch_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	onlyOpen := c.DefaultQuery("open", "true") != "false"
	rows, err := h.services.InsightsServices.ListAlerts(c.Request.Context(), onlyOpen, branchID, 100)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		Acknowledge a KPI alert
// @Tags			Insights
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Alert ID"
// @Success		204
// @Router			/insights/alerts/{id}/ack [patch]
func (h *InsightsHandlers) AcknowledgeAlertHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	user := h.services.UserServices.GetUserFromContext(c)
	if err := h.services.InsightsServices.AcknowledgeAlert(c.Request.Context(), id, user.UserID); err != nil {
		h.fail(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// @Summary		Run anomaly detection now
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]insightsdomain.KPIAlert}
// @Router			/insights/alerts/detect [post]
func (h *InsightsHandlers) DetectAlertsHandler(c *gin.Context) {
	rows, err := h.services.InsightsServices.DetectAnomalies(c.Request.Context())
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// ---------------- Report download with template ----------------

// @Summary		Download a report using a visual template
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		application/octet-stream
// @Param			type		query	string	true	"financial | sales | clients | benchmark"
// @Param			format		query	string	true	"csv | excel | pdf"
// @Param			template_id	query	string	false	"Template (default template if empty)"
// @Param			branch_id	query	string	false	"Branch ID"
// @Param			start		query	string	false	"YYYY-MM-DD"
// @Param			end			query	string	false	"YYYY-MM-DD"
// @Success		200
// @Router			/insights/reports/download [get]
func (h *InsightsHandlers) DownloadReportHandler(c *gin.Context) {
	branchID, r, ok := h.branchAndRange(c)
	if !ok {
		return
	}
	templateID, err := optionalUUID(c.Query("template_id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	file, err := h.services.InsightsServices.GenerateReport(c.Request.Context(), c.Query("type"), c.DefaultQuery("format", "pdf"), branchID, templateID, r.Start, r.End)
	if err != nil {
		h.fail(c, err)
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Filename))
	c.Data(http.StatusOK, file.ContentType, file.Data)
}

// @Summary		Download a report from a temporary shared URL
// @Tags			Insights
// @Produce		application/octet-stream
// @Param			token	path	string	true	"Share token"
// @Success		200
// @Failure		404	{object}	object{error=string}
// @Failure		410	{object}	object{error=string}
// @Router			/public/reports/shared/{token} [get]
func (h *InsightsHandlers) DownloadSharedReportHandler(c *gin.Context) {
	file, err := h.services.InsightsServices.ResolveShareLink(c.Request.Context(), c.Param("token"))
	if err != nil {
		if errors.Is(err, insightsdomain.ErrLinkExpired) {
			c.JSON(http.StatusGone, gin.H{"error": err.Error()})
			return
		}
		h.fail(c, err)
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Filename))
	c.Header("Cache-Control", "no-store")
	c.Data(http.StatusOK, file.ContentType, file.Data)
}

// ---------------- Templates ----------------

type TemplatePayload struct {
	Name         string `json:"name" binding:"required,max=120"`
	PrimaryColor string `json:"primary_color" binding:"required"`
	HeaderText   string `json:"header_text" binding:"max=255"`
	FooterText   string `json:"footer_text" binding:"max=255"`
	Orientation  string `json:"orientation" binding:"omitempty,oneof=L P"`
	IsDefault    bool   `json:"is_default"`
}

func (p TemplatePayload) toModel() *insightsdomain.ReportTemplate {
	return &insightsdomain.ReportTemplate{Name: p.Name, PrimaryColor: p.PrimaryColor, HeaderText: p.HeaderText,
		FooterText: p.FooterText, Orientation: p.Orientation, IsDefault: p.IsDefault}
}

// @Summary		List report templates
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]insightsdomain.ReportTemplate}
// @Router			/insights/templates [get]
func (h *InsightsHandlers) ListTemplatesHandler(c *gin.Context) {
	rows, err := h.services.InsightsServices.ListTemplates(c.Request.Context())
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		Create a report template
// @Tags			Insights
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		TemplatePayload	true	"Template"
// @Success		201		{object}	insightsdomain.ReportTemplate
// @Router			/insights/templates [post]
func (h *InsightsHandlers) CreateTemplateHandler(c *gin.Context) {
	h.saveTemplate(c, uuid.Nil)
}

// @Summary		Update a report template
// @Tags			Insights
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string			true	"Template ID"
// @Param			payload	body		TemplatePayload	true	"Template"
// @Success		200		{object}	insightsdomain.ReportTemplate
// @Router			/insights/templates/{id} [put]
func (h *InsightsHandlers) UpdateTemplateHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	h.saveTemplate(c, id)
}

func (h *InsightsHandlers) saveTemplate(c *gin.Context, id uuid.UUID) {
	var p TemplatePayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	t := p.toModel()
	t.TemplateID = id
	if err := h.services.InsightsServices.SaveTemplate(c.Request.Context(), t); err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) || errors.Is(err, shared_errors.ErrConflict) {
			h.fail(c, err)
			return
		}
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	status := http.StatusOK
	if id == uuid.Nil {
		status = http.StatusCreated
	}
	c.JSON(status, t)
}

// @Summary		Delete a report template (the default one cannot be deleted)
// @Tags			Insights
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Template ID"
// @Success		204
// @Router			/insights/templates/{id} [delete]
func (h *InsightsHandlers) DeleteTemplateHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.InsightsServices.DeleteTemplate(c.Request.Context(), id); err != nil {
		h.fail(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------------- Schedules ----------------

type SchedulePayload struct {
	Name       string   `json:"name" binding:"required,max=120"`
	ReportType string   `json:"report_type" binding:"required,oneof=financial sales clients benchmark"`
	Format     string   `json:"format" binding:"required,oneof=csv excel pdf"`
	Frequency  string   `json:"frequency" binding:"required,oneof=daily weekly monthly"`
	Recipients []string `json:"recipients" binding:"required,min=1,max=20,dive,email"`
	BranchID   string   `json:"branch_id"`
	TemplateID string   `json:"template_id"`
	IsActive   *bool    `json:"is_active"`
}

// @Summary		List scheduled reports
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]insightsdomain.ReportSchedule}
// @Router			/insights/schedules [get]
func (h *InsightsHandlers) ListSchedulesHandler(c *gin.Context) {
	rows, err := h.services.InsightsServices.ListSchedules(c.Request.Context())
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		Schedule a report to be emailed periodically
// @Tags			Insights
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		SchedulePayload	true	"Schedule"
// @Success		201		{object}	insightsdomain.ReportSchedule
// @Router			/insights/schedules [post]
func (h *InsightsHandlers) CreateScheduleHandler(c *gin.Context) {
	h.saveSchedule(c, uuid.Nil)
}

// @Summary		Update a scheduled report
// @Tags			Insights
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string			true	"Schedule ID"
// @Param			payload	body		SchedulePayload	true	"Schedule"
// @Success		200		{object}	insightsdomain.ReportSchedule
// @Router			/insights/schedules/{id} [put]
func (h *InsightsHandlers) UpdateScheduleHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	h.saveSchedule(c, id)
}

func (h *InsightsHandlers) saveSchedule(c *gin.Context, id uuid.UUID) {
	var p SchedulePayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := optionalUUID(p.BranchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	templateID, err := optionalUUID(p.TemplateID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	user := h.services.UserServices.GetUserFromContext(c)
	active := p.IsActive == nil || *p.IsActive
	recipients := make([]string, 0, len(p.Recipients))
	for _, r := range p.Recipients {
		recipients = append(recipients, strings.ToLower(strings.TrimSpace(r)))
	}
	sc := &insightsdomain.ReportSchedule{
		ScheduleID: id, Name: p.Name, ReportType: p.ReportType, Format: p.Format, Frequency: p.Frequency,
		Recipients: recipients, BranchID: branchID, TemplateID: templateID, IsActive: active, CreatedBy: &user.UserID,
	}
	if err := h.services.InsightsServices.SaveSchedule(c.Request.Context(), sc); err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			h.fail(c, err)
			return
		}
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	status := http.StatusOK
	if id == uuid.Nil {
		status = http.StatusCreated
	}
	c.JSON(status, sc)
}

// @Summary		Delete a scheduled report
// @Tags			Insights
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Schedule ID"
// @Success		204
// @Router			/insights/schedules/{id} [delete]
func (h *InsightsHandlers) DeleteScheduleHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.InsightsServices.DeleteSchedule(c.Request.Context(), id); err != nil {
		h.fail(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// @Summary		Send a scheduled report immediately
// @Tags			Insights
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Schedule ID"
// @Success		204
// @Router			/insights/schedules/{id}/send [post]
func (h *InsightsHandlers) SendScheduleHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.InsightsServices.SendSchedule(c.Request.Context(), id); err != nil {
		h.fail(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------------- Share links ----------------

type ShareLinkPayload struct {
	ReportType     string `json:"report_type" binding:"required,oneof=financial sales clients benchmark"`
	Format         string `json:"format" binding:"required,oneof=csv excel pdf"`
	BranchID       string `json:"branch_id"`
	TemplateID     string `json:"template_id"`
	Start          string `json:"start"`
	End            string `json:"end"`
	ExpiresInHours int    `json:"expires_in_hours" binding:"required,min=1,max=720"`
}

// @Summary		List active shared report links
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]insightsdomain.ReportShareLink}
// @Router			/insights/share-links [get]
func (h *InsightsHandlers) ListShareLinksHandler(c *gin.Context) {
	rows, err := h.services.InsightsServices.ListShareLinks(c.Request.Context())
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		Create a temporary URL to share a report with third parties
// @Description	The URL is returned only once; the server stores a hash of the token.
// @Tags			Insights
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		ShareLinkPayload	true	"Link"
// @Success		201		{object}	object{url=string,link=insightsdomain.ReportShareLink}
// @Router			/insights/share-links [post]
func (h *InsightsHandlers) CreateShareLinkHandler(c *gin.Context) {
	var p ShareLinkPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	q := c.Request.URL.Query()
	q.Set("start", p.Start)
	q.Set("end", p.End)
	c.Request.URL.RawQuery = q.Encode()
	r, err := dateRange(c)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := optionalUUID(p.BranchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	templateID, err := optionalUUID(p.TemplateID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	user := h.services.UserServices.GetUserFromContext(c)
	token, link, err := h.services.InsightsServices.CreateShareLink(c.Request.Context(), insightsdomain.ShareLinkRequest{
		ReportType: p.ReportType, Format: p.Format, BranchID: branchID, TemplateID: templateID,
		PeriodStart: r.Start, PeriodEnd: r.End, ExpiresIn: time.Duration(p.ExpiresInHours) * time.Hour, CreatedBy: &user.UserID,
	})
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"url": h.services.InsightsServices.ShareURL(token), "link": link})
}

// @Summary		Revoke a shared report link
// @Tags			Insights
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Link ID"
// @Success		204
// @Router			/insights/share-links/{id} [delete]
func (h *InsightsHandlers) DeleteShareLinkHandler(c *gin.Context) {
	if err := h.services.InsightsServices.DeleteShareLink(c.Request.Context(), c.Param("id")); err != nil {
		h.fail(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------------- API keys ----------------

type APIKeyPayload struct {
	Name      string `json:"name" binding:"required,max=120"`
	ExpiresAt string `json:"expires_at"`
}

// @Summary		List BI API keys
// @Tags			Insights
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]insightsdomain.BIAPIKey}
// @Router			/insights/api-keys [get]
func (h *InsightsHandlers) ListAPIKeysHandler(c *gin.Context) {
	rows, err := h.services.InsightsServices.ListAPIKeys(c.Request.Context())
	if err != nil {
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// @Summary		Create a BI API key
// @Description	The plain key is returned only once. Send it in the X-API-Key header to /v1/bi/*.
// @Tags			Insights
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		APIKeyPayload	true	"Key"
// @Success		201		{object}	object{api_key=string,key=insightsdomain.BIAPIKey}
// @Router			/insights/api-keys [post]
func (h *InsightsHandlers) CreateAPIKeyHandler(c *gin.Context) {
	var p APIKeyPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var expiresAt *time.Time
	if p.ExpiresAt != "" {
		t, err := time.Parse(dateLayout, p.ExpiresAt)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, errors.New("expires_at must be YYYY-MM-DD"))
			return
		}
		expiresAt = &t
	}
	user := h.services.UserServices.GetUserFromContext(c)
	plain, key, err := h.services.InsightsServices.CreateAPIKey(c.Request.Context(), p.Name, expiresAt, user.UserID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"api_key": plain, "key": key})
}

// @Summary		Revoke a BI API key
// @Tags			Insights
// @Security		ApiKeyAuth
// @Param			id	path	string	true	"Key ID"
// @Success		204
// @Router			/insights/api-keys/{id} [delete]
func (h *InsightsHandlers) RevokeAPIKeyHandler(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := h.services.InsightsServices.RevokeAPIKey(c.Request.Context(), id); err != nil {
		h.fail(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
