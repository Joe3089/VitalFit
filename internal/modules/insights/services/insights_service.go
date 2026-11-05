package insightsservices

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	insightsdomain "github.com/vitalfit/api/internal/modules/insights/domain"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	reportdomain "github.com/vitalfit/api/internal/modules/reports/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/mailer"
	"go.uber.org/zap"
)

const (
	anomalyBaselineDays = 28
	anomalyMinZ         = 2.0
	scheduleLinkTTL     = 7 * 24 * time.Hour
	apiKeyPrefix        = "vf_"
)

var (
	hexColor     = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	reportTypes  = map[string]bool{"financial": true, "sales": true, "clients": true, "benchmark": true}
	formats      = map[string]bool{"csv": true, "excel": true, "pdf": true}
	frequencies  = map[string]bool{"daily": true, "weekly": true, "monthly": true}
	eventTypes   = map[string]bool{"visit": true, "signup": true, "checkout": true, "purchase": true}
	reportTitles = map[string]string{
		"financial": "Reporte financiero",
		"sales":     "Reporte de ventas",
		"clients":   "Reporte de clientes",
		"benchmark": "Benchmarking entre sedes",
	}
	metricLabels = map[string]string{"revenue": "Ingresos", "check_ins": "Asistencias (check-ins)"}
)

type InsightsService struct {
	store   store.Storage
	reports reportdomain.ReportServiceInterface
	mailer  mailer.Client
	cfg     config.Config
	logger  *zap.SugaredLogger
}

func NewInsightsService(store store.Storage, reports reportdomain.ReportServiceInterface, mailer mailer.Client, cfg config.Config, logger *zap.SugaredLogger) *InsightsService {
	return &InsightsService{store: store, reports: reports, mailer: mailer, cfg: cfg, logger: logger}
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func randomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }

func pct(part, total int64) float64 {
	if total == 0 {
		return 0
	}
	return round2(100 * float64(part) / float64(total))
}

// ---------------- Conversion, NPS, RevPAS ----------------

func (s *InsightsService) TrackWebEvent(ctx context.Context, sessionID, eventType, path string, userID *uuid.UUID) error {
	if !eventTypes[eventType] {
		return errors.New("invalid event type")
	}
	if len(sessionID) < 8 || len(sessionID) > 64 {
		return errors.New("invalid session id")
	}
	if len(path) > 255 {
		path = path[:255]
	}
	return s.store.Insights.InsertWebEvent(ctx, sessionID, eventType, path, userID)
}

func (s *InsightsService) GetConversionStats(ctx context.Context, r insightsdomain.DateRange) (*insightsdomain.ConversionStats, error) {
	stats, err := s.store.Insights.GetConversionStats(ctx, r)
	if err != nil {
		return nil, err
	}
	stats.SignupRate = pct(stats.Signups, stats.Visitors)
	stats.ConversionRate = pct(stats.Purchases, stats.Visitors)
	if stats.Daily == nil {
		stats.Daily = []insightsdomain.ConversionDay{}
	}
	return stats, nil
}

func (s *InsightsService) GetNPSSummary(ctx context.Context, r insightsdomain.DateRange) (*insightsdomain.NPSSummary, error) {
	return s.store.Insights.GetNPSSummary(ctx, r)
}

func (s *InsightsService) GetRevPAS(ctx context.Context, r insightsdomain.DateRange, branchID *uuid.UUID) (*insightsdomain.RevPASReport, error) {
	return s.store.Insights.GetRevPAS(ctx, r, branchID)
}

// ---------------- Benchmarking (HU-ANALYTICS-21) ----------------

// GetBenchmark compares branches against the network average. Each metric is
// expressed as an index (100 = network average) and the composite score is the
// mean of the available indexes; branches are ranked by it and the leader of
// each metric is flagged as the reference practice.
func (s *InsightsService) GetBenchmark(ctx context.Context, r insightsdomain.DateRange) (*insightsdomain.BenchmarkReport, error) {
	rows, err := s.store.Insights.GetBenchmarkRows(ctx, r)
	if err != nil {
		return nil, err
	}
	metrics := map[string]func(b insightsdomain.BenchmarkRow) (float64, bool){
		"revenue":        func(b insightsdomain.BenchmarkRow) (float64, bool) { return b.Revenue, true },
		"new_clients":    func(b insightsdomain.BenchmarkRow) (float64, bool) { return float64(b.NewClients), true },
		"active_members": func(b insightsdomain.BenchmarkRow) (float64, bool) { return float64(b.ActiveMembers), true },
		"check_ins":      func(b insightsdomain.BenchmarkRow) (float64, bool) { return float64(b.CheckIns), true },
		"occupancy_rate": func(b insightsdomain.BenchmarkRow) (float64, bool) { return b.Occupancy, true },
		"nps": func(b insightsdomain.BenchmarkRow) (float64, bool) {
			if b.NPS == nil {
				return 0, false
			}
			return *b.NPS, true
		},
	}
	avg := map[string]float64{}
	for name, get := range metrics {
		var sum float64
		var n int
		for _, b := range rows {
			if v, ok := get(b); ok {
				sum += v
				n++
			}
		}
		if n > 0 {
			avg[name] = round2(sum / float64(n))
		}
	}

	best := map[string]int{}
	for i := range rows {
		rows[i].Indexes = map[string]float64{}
		rows[i].BestIn = []string{}
		var total float64
		var n int
		for name, get := range metrics {
			v, ok := get(rows[i])
			if !ok {
				continue
			}
			a := avg[name]
			idx := 100.0
			if name == "nps" {
				// NPS can be negative: shift to a 0-200 scale around the average.
				idx = 100 + (v - a)
			} else if a != 0 {
				idx = 100 * v / a
			}
			rows[i].Indexes[name] = round2(idx)
			total += idx
			n++
			if j, ok := best[name]; !ok {
				best[name] = i
			} else if bv, _ := get(rows[j]); v > bv {
				best[name] = i
			}
		}
		if n > 0 {
			rows[i].Score = round2(total / float64(n))
		}
	}
	if len(rows) > 1 {
		for name, i := range best {
			rows[i].BestIn = append(rows[i].BestIn, name)
		}
	}
	sort.SliceStable(rows, func(i, j int) bool { return rows[i].Score > rows[j].Score })
	for i := range rows {
		rows[i].Rank = i + 1
		sort.Strings(rows[i].BestIn)
	}
	return &insightsdomain.BenchmarkReport{Branches: rows, NetworkAverage: avg}, nil
}

// ---------------- Anomaly alerts (HU-ANALYTICS-19) ----------------

func severityFor(z float64) string {
	switch az := math.Abs(z); {
	case az >= 4:
		return "high"
	case az >= 3:
		return "medium"
	default:
		return "low"
	}
}

// DetectAnomalies compares yesterday's value of each metric (per branch and for
// the whole network) with the previous 28 days using a z-score. New alerts are
// stored once per day and pushed as in-app notifications to super admins and
// the branch manager.
func (s *InsightsService) DetectAnomalies(ctx context.Context) ([]insightsdomain.KPIAlert, error) {
	created := []insightsdomain.KPIAlert{}
	branchNames := map[uuid.UUID]string{}
	if branches, err := s.store.Insights.GetBenchmarkRows(ctx, insightsdomain.DateRange{Start: time.Now(), End: time.Now()}); err == nil {
		for _, b := range branches {
			branchNames[b.BranchID] = b.BranchName
		}
	}

	for _, metric := range []string{"revenue", "check_ins"} {
		series, err := s.store.Insights.GetDailySeries(ctx, metric, anomalyBaselineDays+1)
		if err != nil {
			return created, err
		}
		groups := map[string][]insightsdomain.DailyMetric{}
		for _, p := range series {
			key := "network"
			if p.BranchID != nil {
				key = p.BranchID.String()
			}
			groups[key] = append(groups[key], p)
		}
		for _, pts := range groups {
			if len(pts) < anomalyBaselineDays+1 {
				continue
			}
			sort.Slice(pts, func(i, j int) bool { return pts[i].Day.Before(pts[j].Day) })
			observed := pts[len(pts)-1]
			baseline := pts[:len(pts)-1]
			var sum, sq float64
			for _, p := range baseline {
				sum += p.Value
			}
			mean := sum / float64(len(baseline))
			for _, p := range baseline {
				sq += (p.Value - mean) * (p.Value - mean)
			}
			std := math.Sqrt(sq / float64(len(baseline)))
			if mean < 1 {
				continue // not enough activity to judge
			}
			var z float64
			if std == 0 {
				if observed.Value == mean {
					continue
				}
				z = math.Copysign(5, observed.Value-mean)
			} else {
				z = (observed.Value - mean) / std
			}
			if math.Abs(z) < anomalyMinZ {
				continue
			}

			scope := "toda la red"
			if observed.BranchID != nil {
				scope = "la sucursal " + branchNames[*observed.BranchID]
			}
			direction := "por debajo"
			if z > 0 {
				direction = "por encima"
			}
			deviation := 0.0
			if mean != 0 {
				deviation = math.Abs(observed.Value-mean) / mean * 100
			}
			alert := insightsdomain.KPIAlert{
				BranchID:      observed.BranchID,
				Metric:        metric,
				Severity:      severityFor(z),
				ObservedValue: round2(observed.Value),
				ExpectedValue: round2(mean),
				ZScore:        round2(z),
				AlertDate:     observed.Day,
				Message: fmt.Sprintf("%s de %s el %s fue %.2f, %.0f%% %s del promedio de los últimos %d días (%.2f).",
					metricLabels[metric], scope, observed.Day.Format("02/01/2006"), observed.Value, deviation, direction, anomalyBaselineDays, mean),
			}
			inserted, err := s.store.Insights.InsertAlert(ctx, &alert)
			if err != nil {
				return created, err
			}
			if inserted {
				created = append(created, alert)
				s.notifyAlert(ctx, alert)
			}
		}
	}
	return created, nil
}

func (s *InsightsService) notifyAlert(ctx context.Context, a insightsdomain.KPIAlert) {
	recipients, err := s.store.Insights.GetAlertRecipients(ctx, a.BranchID)
	if err != nil || len(recipients) == 0 {
		return
	}
	batch := make([]notidomain.Notification, 0, len(recipients))
	for _, uid := range recipients {
		batch = append(batch, notidomain.Notification{
			UserID:   uid,
			Title:    "Alerta de anomalía en KPI",
			Message:  a.Message,
			Type:     "kpi_anomaly",
			Metadata: map[string]interface{}{"alert_id": a.AlertID.String(), "severity": a.Severity, "metric": a.Metric},
		})
	}
	if err := s.store.Notification.CreateBatchNotifications(ctx, batch); err != nil && s.logger != nil {
		s.logger.Errorw("failed to notify kpi anomaly", "error", err)
	}
}

func (s *InsightsService) ListAlerts(ctx context.Context, onlyOpen bool, branchID *uuid.UUID, limit int) ([]insightsdomain.KPIAlert, error) {
	return s.store.Insights.ListAlerts(ctx, onlyOpen, branchID, limit)
}

func (s *InsightsService) AcknowledgeAlert(ctx context.Context, id, userID uuid.UUID) error {
	return s.store.Insights.AcknowledgeAlert(ctx, id, userID)
}

// ---------------- Templates (HU-ANALYTICS-22) ----------------

func (s *InsightsService) ListTemplates(ctx context.Context) ([]insightsdomain.ReportTemplate, error) {
	return s.store.Insights.ListTemplates(ctx)
}

func (s *InsightsService) SaveTemplate(ctx context.Context, t *insightsdomain.ReportTemplate) error {
	t.Name = strings.TrimSpace(t.Name)
	if t.Name == "" {
		return errors.New("name is required")
	}
	if !hexColor.MatchString(t.PrimaryColor) {
		return errors.New("primary_color must be a hex value like #f58a24")
	}
	if t.Orientation != "P" {
		t.Orientation = "L"
	}
	if strings.TrimSpace(t.HeaderText) == "" {
		t.HeaderText = "VitalFit"
	}
	return s.store.Insights.SaveTemplate(ctx, t)
}

func (s *InsightsService) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return s.store.Insights.DeleteTemplate(ctx, id)
}

// ---------------- Report generation ----------------

func money(v fmt.Stringer) string { return v.String() }

func (s *InsightsService) buildTable(ctx context.Context, reportType string, branchID *uuid.UUID, start, end time.Time) (table, error) {
	t := table{
		Title:  reportTitles[reportType],
		Period: fmt.Sprintf("Período: %s - %s", start.Format("02/01/2006"), end.Add(-time.Second).Format("02/01/2006")),
	}
	switch reportType {
	case "financial":
		rows, err := s.reports.GetFinancialReportData(ctx, branchID, start, end)
		if err != nil {
			return t, err
		}
		t.Headers = []string{"Fecha", "Sucursal", "Cliente", "Categoría", "Concepto", "Monto", "Estado"}
		for _, r := range rows {
			t.Rows = append(t.Rows, []string{r.Date.Format("2006-01-02"), r.BranchName, r.ClientName, r.Category, r.Concept, money(r.Amount), r.Status})
		}
	case "sales":
		rows, err := s.reports.GetSalesReportData(ctx, branchID, start, end)
		if err != nil {
			return t, err
		}
		t.Headers = []string{"Fecha", "Sucursal", "Ítem", "Categoría", "Cantidad", "Total", "Método de pago"}
		for _, r := range rows {
			t.Rows = append(t.Rows, []string{r.Date.Format("2006-01-02"), r.BranchName, r.ItemName, r.Category, fmt.Sprint(r.Quantity), money(r.Total), r.PaymentMethod})
		}
	case "clients":
		rows, err := s.reports.GetClientReportData(ctx)
		if err != nil {
			return t, err
		}
		t.Period = "Estado actual de la cartera de clientes"
		t.Headers = []string{"Nombre", "Email", "Teléfono", "Última visita", "Visitas mes", "Visitas mes anterior", "Vence membresía", "Segmento"}
		for _, r := range rows {
			last, endDate := "-", "-"
			if r.LastCheckIn != nil {
				last = r.LastCheckIn.Format("2006-01-02")
			}
			if r.MembershipEndDate != nil {
				endDate = r.MembershipEndDate.Format("2006-01-02")
			}
			t.Rows = append(t.Rows, []string{r.FirstName + " " + r.LastName, r.Email, r.Phone, last,
				fmt.Sprint(r.CurrentMonthVisits), fmt.Sprint(r.LastMonthVisits), endDate, r.CurrentCategory})
		}
	case "benchmark":
		b, err := s.GetBenchmark(ctx, insightsdomain.DateRange{Start: start, End: end})
		if err != nil {
			return t, err
		}
		t.Headers = []string{"Ranking", "Sucursal", "Ingresos", "Nuevos clientes", "Miembros activos", "Check-ins", "Ocupación %", "NPS", "Índice compuesto"}
		for _, r := range b.Branches {
			nps := "-"
			if r.NPS != nil {
				nps = fmt.Sprintf("%.1f", *r.NPS)
			}
			t.Rows = append(t.Rows, []string{fmt.Sprint(r.Rank), r.BranchName, fmt.Sprintf("%.2f", r.Revenue), fmt.Sprint(r.NewClients),
				fmt.Sprint(r.ActiveMembers), fmt.Sprint(r.CheckIns), fmt.Sprintf("%.2f", r.Occupancy), nps, fmt.Sprintf("%.2f", r.Score)})
		}
	default:
		return t, insightsdomain.ErrInvalidReportType
	}
	return t, nil
}

func (s *InsightsService) template(ctx context.Context, id *uuid.UUID) insightsdomain.ReportTemplate {
	t, err := s.store.Insights.GetTemplate(ctx, id)
	if err != nil {
		if id != nil {
			if t, err = s.store.Insights.GetTemplate(ctx, nil); err == nil {
				return *t
			}
		}
		return insightsdomain.DefaultTemplate()
	}
	return *t
}

func (s *InsightsService) GenerateReport(ctx context.Context, reportType, format string, branchID, templateID *uuid.UUID, start, end time.Time) (*insightsdomain.ReportFile, error) {
	if !reportTypes[reportType] {
		return nil, insightsdomain.ErrInvalidReportType
	}
	if !formats[format] {
		return nil, insightsdomain.ErrInvalidFormat
	}
	t, err := s.buildTable(ctx, reportType, branchID, start, end)
	if err != nil {
		return nil, err
	}
	return render(t, format, s.template(ctx, templateID), reportType+"_report")
}

// ---------------- Share links (HU-ANALYTICS-18) ----------------

func (s *InsightsService) ShareURL(token string) string {
	base := strings.TrimRight(s.cfg.ApiUrl, "/")
	if !strings.HasPrefix(base, "http") {
		base = "http://" + base
	}
	return fmt.Sprintf("%s/v1/public/reports/shared/%s", base, token)
}

func (s *InsightsService) CreateShareLink(ctx context.Context, req insightsdomain.ShareLinkRequest) (string, *insightsdomain.ReportShareLink, error) {
	if !reportTypes[req.ReportType] {
		return "", nil, insightsdomain.ErrInvalidReportType
	}
	if !formats[req.Format] {
		return "", nil, insightsdomain.ErrInvalidFormat
	}
	if req.ExpiresIn <= 0 || req.ExpiresIn > 30*24*time.Hour {
		return "", nil, errors.New("expiration must be between 1 hour and 30 days")
	}
	if !req.PeriodEnd.After(req.PeriodStart) {
		return "", nil, errors.New("period end must be after period start")
	}
	token, err := randomToken(32)
	if err != nil {
		return "", nil, err
	}
	link := &insightsdomain.ReportShareLink{
		TokenHash:   hashToken(token),
		ReportType:  req.ReportType,
		Format:      req.Format,
		BranchID:    req.BranchID,
		TemplateID:  req.TemplateID,
		PeriodStart: req.PeriodStart,
		PeriodEnd:   req.PeriodEnd,
		ExpiresAt:   time.Now().Add(req.ExpiresIn),
		CreatedBy:   req.CreatedBy,
	}
	if err := s.store.Insights.CreateShareLink(ctx, link); err != nil {
		return "", nil, err
	}
	return token, link, nil
}

func (s *InsightsService) ResolveShareLink(ctx context.Context, token string) (*insightsdomain.ReportFile, error) {
	link, err := s.store.Insights.GetShareLink(ctx, hashToken(token))
	if err != nil {
		return nil, err
	}
	if time.Now().After(link.ExpiresAt) {
		return nil, insightsdomain.ErrLinkExpired
	}
	file, err := s.GenerateReport(ctx, link.ReportType, link.Format, link.BranchID, link.TemplateID, link.PeriodStart, link.PeriodEnd)
	if err != nil {
		return nil, err
	}
	_ = s.store.Insights.IncrementShareLinkAccess(ctx, link.TokenHash)
	return file, nil
}

func (s *InsightsService) ListShareLinks(ctx context.Context) ([]insightsdomain.ReportShareLink, error) {
	return s.store.Insights.ListShareLinks(ctx)
}

func (s *InsightsService) DeleteShareLink(ctx context.Context, id string) error {
	return s.store.Insights.DeleteShareLink(ctx, id)
}

// ---------------- Scheduled reports (HU-ANALYTICS-16) ----------------

func (s *InsightsService) ListSchedules(ctx context.Context) ([]insightsdomain.ReportSchedule, error) {
	return s.store.Insights.ListSchedules(ctx)
}

func (s *InsightsService) SaveSchedule(ctx context.Context, sc *insightsdomain.ReportSchedule) error {
	if strings.TrimSpace(sc.Name) == "" {
		return errors.New("name is required")
	}
	if !reportTypes[sc.ReportType] {
		return insightsdomain.ErrInvalidReportType
	}
	if !formats[sc.Format] {
		return insightsdomain.ErrInvalidFormat
	}
	if !frequencies[sc.Frequency] {
		return errors.New("frequency must be daily, weekly or monthly")
	}
	if len(sc.Recipients) == 0 || len(sc.Recipients) > 20 {
		return errors.New("between 1 and 20 recipients are required")
	}
	return s.store.Insights.SaveSchedule(ctx, sc)
}

func (s *InsightsService) DeleteSchedule(ctx context.Context, id uuid.UUID) error {
	return s.store.Insights.DeleteSchedule(ctx, id)
}

// periodFor returns the last complete period for a frequency.
func periodFor(frequency string, now time.Time) (time.Time, time.Time) {
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	switch frequency {
	case "daily":
		return today.AddDate(0, 0, -1), today
	case "weekly":
		return today.AddDate(0, 0, -7), today
	default:
		firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		return firstOfMonth.AddDate(0, -1, 0), firstOfMonth
	}
}

// SendSchedule emails a temporary download link of the report to every recipient.
func (s *InsightsService) SendSchedule(ctx context.Context, id uuid.UUID) error {
	sc, err := s.store.Insights.GetSchedule(ctx, id)
	if err != nil {
		return err
	}
	start, end := periodFor(sc.Frequency, time.Now())
	token, link, err := s.CreateShareLink(ctx, insightsdomain.ShareLinkRequest{
		ReportType: sc.ReportType, Format: sc.Format, BranchID: sc.BranchID, TemplateID: sc.TemplateID,
		PeriodStart: start, PeriodEnd: end, ExpiresIn: scheduleLinkTTL, CreatedBy: sc.CreatedBy,
	})
	if err != nil {
		return err
	}
	data := struct {
		ReportName, ReportType, Format, Period, DownloadURL, ExpiresAt string
	}{
		ReportName:  sc.Name,
		ReportType:  reportTitles[sc.ReportType],
		Format:      strings.ToUpper(sc.Format),
		Period:      fmt.Sprintf("%s - %s", start.Format("02/01/2006"), end.AddDate(0, 0, -1).Format("02/01/2006")),
		DownloadURL: s.ShareURL(token),
		ExpiresAt:   link.ExpiresAt.Format("02/01/2006 15:04"),
	}
	var sendErrs []string
	for _, email := range sc.Recipients {
		if _, err := s.mailer.Send(mailer.ScheduledReportTemplate, email, email, data, s.cfg.Env != "production"); err != nil {
			sendErrs = append(sendErrs, fmt.Sprintf("%s: %v", email, err))
		}
	}
	if len(sendErrs) == len(sc.Recipients) {
		return fmt.Errorf("report could not be sent: %s", strings.Join(sendErrs, "; "))
	}
	if len(sendErrs) > 0 && s.logger != nil {
		s.logger.Warnw("scheduled report partially sent", "schedule_id", id, "errors", sendErrs)
	}
	return s.store.Insights.MarkScheduleSent(ctx, id)
}

func (s *InsightsService) RunDueSchedules(ctx context.Context) (int, error) {
	due, err := s.store.Insights.GetDueSchedules(ctx)
	if err != nil {
		return 0, err
	}
	sent := 0
	for _, sc := range due {
		if err := s.SendSchedule(ctx, sc.ScheduleID); err != nil {
			if s.logger != nil {
				s.logger.Errorw("failed to send scheduled report", "schedule_id", sc.ScheduleID, "error", err)
			}
			continue
		}
		sent++
	}
	return sent, nil
}

// ---------------- BI API keys (HU-ANALYTICS-17) ----------------

func (s *InsightsService) CreateAPIKey(ctx context.Context, name string, expiresAt *time.Time, createdBy uuid.UUID) (string, *insightsdomain.BIAPIKey, error) {
	if strings.TrimSpace(name) == "" {
		return "", nil, errors.New("name is required")
	}
	if expiresAt != nil && expiresAt.Before(time.Now()) {
		return "", nil, errors.New("expires_at must be in the future")
	}
	secret, err := randomToken(32)
	if err != nil {
		return "", nil, err
	}
	plain := apiKeyPrefix + secret
	key := &insightsdomain.BIAPIKey{
		Name:      strings.TrimSpace(name),
		KeyPrefix: plain[:10],
		KeyHash:   hashToken(plain),
		CreatedBy: &createdBy,
		ExpiresAt: expiresAt,
	}
	if err := s.store.Insights.CreateAPIKey(ctx, key); err != nil {
		return "", nil, err
	}
	return plain, key, nil
}

func (s *InsightsService) AuthenticateAPIKey(ctx context.Context, plain string) (*insightsdomain.BIAPIKey, error) {
	if !strings.HasPrefix(plain, apiKeyPrefix) {
		return nil, shared_errors.ErrUnauthorized
	}
	key, err := s.store.Insights.GetAPIKeyByHash(ctx, hashToken(plain))
	if err != nil {
		return nil, shared_errors.ErrUnauthorized
	}
	_ = s.store.Insights.TouchAPIKey(ctx, key.KeyID)
	return key, nil
}

func (s *InsightsService) ListAPIKeys(ctx context.Context) ([]insightsdomain.BIAPIKey, error) {
	return s.store.Insights.ListAPIKeys(ctx)
}

func (s *InsightsService) RevokeAPIKey(ctx context.Context, id uuid.UUID) error {
	return s.store.Insights.RevokeAPIKey(ctx, id)
}
