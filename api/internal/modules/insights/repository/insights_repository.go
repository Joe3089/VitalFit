package insightsrepository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	insightsdomain "github.com/vitalfit/api/internal/modules/insights/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

type InsightsStore struct {
	db *gorm.DB
}

func NewInsightsStore(db *gorm.DB) *InsightsStore {
	return &InsightsStore{db: db}
}

func notFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return shared_errors.ErrNotFound
	}
	return err
}

func rowsOrNotFound(res *gorm.DB) error {
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}
	return nil
}

// ---------------- Conversion (HU-ANALYTICS-03) ----------------

func (r *InsightsStore) InsertWebEvent(ctx context.Context, sessionID, eventType, path string, userID *uuid.UUID) error {
	return r.db.WithContext(ctx).Exec(
		`INSERT INTO web_events (session_id, event_type, path, user_id) VALUES (?, ?, ?, ?)`,
		sessionID, eventType, path, userID).Error
}

// GetConversionStats counts distinct web sessions per funnel step. A session
// converts when it reaches the "purchase" step.
func (r *InsightsStore) GetConversionStats(ctx context.Context, rg insightsdomain.DateRange) (*insightsdomain.ConversionStats, error) {
	var s insightsdomain.ConversionStats
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			COUNT(DISTINCT session_id) AS visitors,
			COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'signup') AS signups,
			COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'checkout') AS checkouts,
			COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'purchase') AS purchases
		FROM web_events
		WHERE created_at >= ? AND created_at < ?`, rg.Start, rg.End).Scan(&s).Error
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).Raw(`
		SELECT date_trunc('day', created_at) AS day,
			COUNT(DISTINCT session_id) AS visitors,
			COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'signup') AS signups,
			COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'purchase') AS purchases
		FROM web_events
		WHERE created_at >= ? AND created_at < ?
		GROUP BY 1 ORDER BY 1`, rg.Start, rg.End).Scan(&s.Daily).Error
	return &s, err
}

// ---------------- NPS (HU-ANALYTICS-06) ----------------

const npsSelect = `
	COUNT(*) AS responses,
	COUNT(*) FILTER (WHERE n.score >= 9) AS promoters,
	COUNT(*) FILTER (WHERE n.score BETWEEN 7 AND 8) AS passives,
	COUNT(*) FILTER (WHERE n.score <= 6) AS detractors,
	COALESCE(ROUND(AVG(n.score)::numeric, 2), 0) AS average,
	COALESCE(ROUND(100.0 * (COUNT(*) FILTER (WHERE n.score >= 9) - COUNT(*) FILTER (WHERE n.score <= 6)) / NULLIF(COUNT(*), 0), 1), 0) AS nps`

func (r *InsightsStore) GetNPSSummary(ctx context.Context, rg insightsdomain.DateRange) (*insightsdomain.NPSSummary, error) {
	var s insightsdomain.NPSSummary
	db := r.db.WithContext(ctx)
	if err := db.Raw(`SELECT `+npsSelect+` FROM nps_responses n WHERE n.created_at >= ? AND n.created_at < ?`, rg.Start, rg.End).
		Scan(&s.NPSBranch).Error; err != nil {
		return nil, err
	}
	if err := db.Raw(`SELECT n.branch_id, COALESCE(b.name, 'Sin sucursal') AS branch_name, `+npsSelect+`
		FROM nps_responses n LEFT JOIN branch b ON b.branch_id = n.branch_id
		WHERE n.created_at >= ? AND n.created_at < ?
		GROUP BY n.branch_id, b.name ORDER BY nps DESC`, rg.Start, rg.End).Scan(&s.ByBranch).Error; err != nil {
		return nil, err
	}
	if err := db.Raw(`SELECT to_char(date_trunc('month', n.created_at), 'YYYY-MM') AS month, `+npsSelect+`
		FROM nps_responses n
		WHERE n.created_at >= ? AND n.created_at < ?
		GROUP BY 1 ORDER BY 1`, rg.Start, rg.End).Scan(&s.Monthly).Error; err != nil {
		return nil, err
	}
	err := db.Raw(`SELECT n.score, n.comment, COALESCE(b.name, '') AS branch_name, n.created_at
		FROM nps_responses n LEFT JOIN branch b ON b.branch_id = n.branch_id
		WHERE n.created_at >= ? AND n.created_at < ? AND COALESCE(n.comment, '') <> ''
		ORDER BY n.created_at DESC LIMIT 20`, rg.Start, rg.End).Scan(&s.Recent).Error
	return &s, err
}

// ---------------- RevPAS (HU-ANALYTICS-11) ----------------

// GetRevPAS computes Revenue Per Available Space: revenue divided by the class
// spaces offered (sum of max_capacity of non-cancelled classes) in the period.
// Branch level uses all completed payments of the branch; service level uses
// paid invoice items of that service.
func (r *InsightsStore) GetRevPAS(ctx context.Context, rg insightsdomain.DateRange, branchID *uuid.UUID) (*insightsdomain.RevPASReport, error) {
	report := &insightsdomain.RevPASReport{}
	branchFilter := ""
	args := map[string]interface{}{"start": rg.Start, "end": rg.End}
	if branchID != nil {
		branchFilter = "AND b.branch_id = @branch"
		args["branch"] = *branchID
	}
	db := r.db.WithContext(ctx)

	err := db.Raw(`
		WITH cap AS (
			SELECT c.branch_id, SUM(c.max_capacity) AS available,
				SUM((SELECT COUNT(*) FROM bookings bk WHERE bk.class_id = c.class_id AND bk.status = 'Confirmed' AND bk.deleted_at IS NULL)) AS booked
			FROM classes c
			WHERE c.starts_at >= @start AND c.starts_at < @end AND c.deleted_at IS NULL AND c.status <> 'Cancelled'
			GROUP BY c.branch_id
		), rev AS (
			SELECT i.branch_id, SUM(p.amount_base) AS revenue
			FROM payments p JOIN invoices i ON i.invoice_id = p.invoice_id
			WHERE p.status = 'Completed' AND p.deleted_at IS NULL AND p.payment_date >= @start AND p.payment_date < @end
			GROUP BY i.branch_id
		)
		SELECT b.branch_id, b.name AS branch_name,
			COALESCE(rev.revenue, 0)::float8 AS revenue,
			COALESCE(cap.available, 0) AS available_spaces,
			COALESCE(cap.booked, 0) AS booked_spaces,
			COALESCE(ROUND(100.0 * cap.booked / NULLIF(cap.available, 0), 2), 0)::float8 AS occupancy,
			COALESCE(ROUND(rev.revenue / NULLIF(cap.available, 0), 2), 0)::float8 AS rev_pas
		FROM branch b
		LEFT JOIN cap ON cap.branch_id = b.branch_id
		LEFT JOIN rev ON rev.branch_id = b.branch_id
		WHERE b.deleted_at IS NULL `+branchFilter+`
		ORDER BY rev_pas DESC`, args).Scan(&report.ByBranch).Error
	if err != nil {
		return nil, err
	}

	err = db.Raw(`
		WITH cap AS (
			SELECT c.branch_id, c.service_id, SUM(c.max_capacity) AS available,
				SUM((SELECT COUNT(*) FROM bookings bk WHERE bk.class_id = c.class_id AND bk.status = 'Confirmed' AND bk.deleted_at IS NULL)) AS booked
			FROM classes c
			WHERE c.starts_at >= @start AND c.starts_at < @end AND c.deleted_at IS NULL AND c.status <> 'Cancelled'
			GROUP BY c.branch_id, c.service_id
		), rev AS (
			SELECT i.branch_id, ii.service_id, SUM(ii.unit_price * ii.quantity - COALESCE(ii.discount_applied, 0)) AS revenue
			FROM invoice_items ii JOIN invoices i ON i.invoice_id = ii.invoice_id
			WHERE i.status = 'Paid' AND i.deleted_at IS NULL AND ii.service_id IS NOT NULL
			  AND i.issue_date >= CAST(@start AS date) AND i.issue_date < CAST(@end AS date)
			GROUP BY i.branch_id, ii.service_id
		)
		SELECT b.branch_id, b.name AS branch_name, s.service_id::text AS service_id, s.name AS service_name,
			COALESCE(rev.revenue, 0)::float8 AS revenue,
			cap.available AS available_spaces,
			cap.booked AS booked_spaces,
			COALESCE(ROUND(100.0 * cap.booked / NULLIF(cap.available, 0), 2), 0)::float8 AS occupancy,
			COALESCE(ROUND(rev.revenue / NULLIF(cap.available, 0), 2), 0)::float8 AS rev_pas
		FROM cap
		JOIN branch b ON b.branch_id = cap.branch_id
		JOIN services s ON s.service_id = cap.service_id
		LEFT JOIN rev ON rev.branch_id = cap.branch_id AND rev.service_id = cap.service_id
		WHERE b.deleted_at IS NULL `+branchFilter+`
		ORDER BY rev_pas DESC, available_spaces DESC`, args).Scan(&report.ByService).Error
	if err != nil {
		return nil, err
	}

	for _, row := range report.ByBranch {
		report.Revenue += row.Revenue
		report.AvailableSpaces += row.AvailableSpaces
	}
	if report.AvailableSpaces > 0 {
		report.RevPAS = float64(int64(report.Revenue/float64(report.AvailableSpaces)*100+0.5)) / 100
	}
	return report, nil
}

// ---------------- Benchmark (HU-ANALYTICS-21) ----------------

func (r *InsightsStore) GetBenchmarkRows(ctx context.Context, rg insightsdomain.DateRange) ([]insightsdomain.BenchmarkRow, error) {
	var rows []insightsdomain.BenchmarkRow
	err := r.db.WithContext(ctx).Raw(`
		WITH rev AS (
			SELECT i.branch_id, SUM(p.amount_base) AS revenue
			FROM payments p JOIN invoices i ON i.invoice_id = p.invoice_id
			WHERE p.status = 'Completed' AND p.deleted_at IS NULL AND p.payment_date >= @start AND p.payment_date < @end
			GROUP BY i.branch_id
		), first_invoice AS (
			SELECT DISTINCT ON (i.user_id) i.user_id, i.branch_id, i.issue_date
			FROM invoices i WHERE i.deleted_at IS NULL AND i.status <> 'Void'
			ORDER BY i.user_id, i.issue_date
		), newc AS (
			SELECT branch_id, COUNT(*) AS new_clients FROM first_invoice
			WHERE issue_date >= CAST(@start AS date) AND issue_date < CAST(@end AS date) GROUP BY branch_id
		), members AS (
			SELECT i.branch_id, COUNT(DISTINCT cm.user_id) AS active_members
			FROM client_memberships cm JOIN invoices i ON i.invoice_id = cm.invoice_id
			WHERE cm.status = 'Active' AND cm.end_date >= CURRENT_DATE
			GROUP BY i.branch_id
		), visits AS (
			SELECT branch_id, COUNT(*) AS check_ins FROM attendance_log
			WHERE check_in_time >= @start AND check_in_time < @end AND status = 'Attended'
			GROUP BY branch_id
		), cap AS (
			SELECT c.branch_id, SUM(c.max_capacity) AS capacity,
				SUM((SELECT COUNT(*) FROM bookings bk WHERE bk.class_id = c.class_id AND bk.status = 'Confirmed' AND bk.deleted_at IS NULL)) AS booked
			FROM classes c
			WHERE c.starts_at >= @start AND c.starts_at < @end AND c.deleted_at IS NULL AND c.status <> 'Cancelled'
			GROUP BY c.branch_id
		), nps AS (
			SELECT branch_id,
				ROUND(100.0 * (COUNT(*) FILTER (WHERE score >= 9) - COUNT(*) FILTER (WHERE score <= 6)) / COUNT(*), 1)::float8 AS nps
			FROM nps_responses WHERE created_at >= @start AND created_at < @end AND branch_id IS NOT NULL
			GROUP BY branch_id
		)
		SELECT b.branch_id, b.name AS branch_name,
			COALESCE(rev.revenue, 0)::float8 AS revenue,
			COALESCE(newc.new_clients, 0) AS new_clients,
			COALESCE(members.active_members, 0) AS active_members,
			COALESCE(visits.check_ins, 0) AS check_ins,
			COALESCE(cap.capacity, 0) AS capacity,
			COALESCE(cap.booked, 0) AS booked,
			COALESCE(ROUND(100.0 * cap.booked / NULLIF(cap.capacity, 0), 2), 0)::float8 AS occupancy,
			nps.nps AS nps
		FROM branch b
		LEFT JOIN rev ON rev.branch_id = b.branch_id
		LEFT JOIN newc ON newc.branch_id = b.branch_id
		LEFT JOIN members ON members.branch_id = b.branch_id
		LEFT JOIN visits ON visits.branch_id = b.branch_id
		LEFT JOIN cap ON cap.branch_id = b.branch_id
		LEFT JOIN nps ON nps.branch_id = b.branch_id
		WHERE b.deleted_at IS NULL AND b.status = 'Active'
		ORDER BY b.name`, map[string]interface{}{"start": rg.Start, "end": rg.End}).Scan(&rows).Error
	return rows, err
}

// ---------------- Anomaly detection (HU-ANALYTICS-19) ----------------

// GetDailySeries returns one value per (branch, day) for the last `days` full
// days, zero-filled, plus the network total (BranchID nil).
func (r *InsightsStore) GetDailySeries(ctx context.Context, metric string, days int) ([]insightsdomain.DailyMetric, error) {
	var source string
	switch metric {
	case "revenue":
		source = `SELECT i.branch_id, date_trunc('day', p.payment_date) AS day, SUM(p.amount_base)::float8 AS value
			FROM payments p JOIN invoices i ON i.invoice_id = p.invoice_id
			WHERE p.status = 'Completed' AND p.deleted_at IS NULL AND p.payment_date >= @from AND p.payment_date < @to
			GROUP BY 1, 2`
	case "check_ins":
		source = `SELECT branch_id, date_trunc('day', check_in_time) AS day, COUNT(*)::float8 AS value
			FROM attendance_log
			WHERE status = 'Attended' AND check_in_time >= @from AND check_in_time < @to
			GROUP BY 1, 2`
	default:
		return nil, fmt.Errorf("unknown metric %q", metric)
	}
	var rows []insightsdomain.DailyMetric
	err := r.db.WithContext(ctx).Raw(`
		WITH days AS (
			SELECT generate_series(CAST(@from AS timestamptz), CAST(@to AS timestamptz) - INTERVAL '1 day', INTERVAL '1 day') AS day
		), src AS (`+source+`),
		per_branch AS (
			SELECT b.branch_id, d.day, COALESCE(src.value, 0) AS value
			FROM branch b CROSS JOIN days d
			LEFT JOIN src ON src.branch_id = b.branch_id AND src.day = d.day
			WHERE b.deleted_at IS NULL AND b.status = 'Active'
		)
		SELECT branch_id, day, value FROM per_branch
		UNION ALL
		SELECT NULL::uuid, d.day, COALESCE((SELECT SUM(value) FROM src WHERE src.day = d.day), 0)
		FROM days d
		ORDER BY 1 NULLS FIRST, 2`,
		map[string]interface{}{
			"from": gorm.Expr(fmt.Sprintf("date_trunc('day', NOW()) - INTERVAL '%d days'", days)),
			"to":   gorm.Expr("date_trunc('day', NOW())"),
		}).Scan(&rows).Error
	return rows, err
}

func (r *InsightsStore) InsertAlert(ctx context.Context, a *insightsdomain.KPIAlert) (bool, error) {
	res := r.db.WithContext(ctx).Raw(`
		INSERT INTO kpi_alerts (branch_id, metric, severity, message, observed_value, expected_value, z_score, alert_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT DO NOTHING
		RETURNING alert_id, created_at`,
		a.BranchID, a.Metric, a.Severity, a.Message, a.ObservedValue, a.ExpectedValue, a.ZScore, a.AlertDate).
		Scan(a)
	return res.RowsAffected > 0, res.Error
}

func (r *InsightsStore) ListAlerts(ctx context.Context, onlyOpen bool, branchID *uuid.UUID, limit int) ([]insightsdomain.KPIAlert, error) {
	q := r.db.WithContext(ctx).Table("kpi_alerts a").
		Select("a.*, COALESCE(b.name, 'Red completa') AS branch_name").
		Joins("LEFT JOIN branch b ON b.branch_id = a.branch_id")
	if onlyOpen {
		q = q.Where("a.acknowledged_at IS NULL")
	}
	if branchID != nil {
		q = q.Where("a.branch_id = ?", *branchID)
	}
	var rows []insightsdomain.KPIAlert
	err := q.Order("a.alert_date DESC, a.created_at DESC").Limit(limit).Scan(&rows).Error
	return rows, err
}

func (r *InsightsStore) AcknowledgeAlert(ctx context.Context, id, userID uuid.UUID) error {
	return rowsOrNotFound(r.db.WithContext(ctx).Exec(
		`UPDATE kpi_alerts SET acknowledged_at = NOW(), acknowledged_by = ? WHERE alert_id = ? AND acknowledged_at IS NULL`, userID, id))
}

// GetAlertRecipients returns super admins plus the manager of the branch.
func (r *InsightsStore) GetAlertRecipients(ctx context.Context, branchID *uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	q := `SELECT u.user_id FROM users u JOIN roles r ON r.role_id = u.role_id
		WHERE r.name = 'super_admin' AND u.deleted_at IS NULL`
	args := []interface{}{}
	if branchID != nil {
		q += ` UNION SELECT b.user_id FROM branch b WHERE b.branch_id = ?`
		args = append(args, *branchID)
	}
	err := r.db.WithContext(ctx).Raw(q, args...).Scan(&ids).Error
	return ids, err
}

// ---------------- Templates (HU-ANALYTICS-22) ----------------

func (r *InsightsStore) ListTemplates(ctx context.Context) ([]insightsdomain.ReportTemplate, error) {
	var rows []insightsdomain.ReportTemplate
	err := r.db.WithContext(ctx).Order("is_default DESC, name").Find(&rows).Error
	return rows, err
}

// GetTemplate returns the requested template or, when id is nil, the default one.
func (r *InsightsStore) GetTemplate(ctx context.Context, id *uuid.UUID) (*insightsdomain.ReportTemplate, error) {
	var t insightsdomain.ReportTemplate
	q := r.db.WithContext(ctx)
	var err error
	if id != nil {
		err = q.First(&t, "template_id = ?", *id).Error
	} else {
		err = q.Where("is_default").Order("updated_at DESC").First(&t).Error
	}
	if err != nil {
		return nil, notFound(err)
	}
	return &t, nil
}

func (r *InsightsStore) SaveTemplate(ctx context.Context, t *insightsdomain.ReportTemplate) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if t.IsDefault {
			if err := tx.Exec("UPDATE report_templates SET is_default = FALSE WHERE template_id <> ?", t.TemplateID).Error; err != nil {
				return err
			}
		}
		var err error
		if t.TemplateID == uuid.Nil {
			err = tx.Create(t).Error
		} else {
			err = rowsOrNotFound(tx.Model(&insightsdomain.ReportTemplate{}).Where("template_id = ?", t.TemplateID).
				Updates(map[string]interface{}{
					"name": t.Name, "primary_color": t.PrimaryColor, "header_text": t.HeaderText,
					"footer_text": t.FooterText, "orientation": t.Orientation, "is_default": t.IsDefault,
					"updated_at": gorm.Expr("NOW()"),
				}))
		}
		if err != nil && strings.Contains(err.Error(), "23505") {
			return shared_errors.ErrConflict
		}
		return err
	})
}

func (r *InsightsStore) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return rowsOrNotFound(r.db.WithContext(ctx).Exec("DELETE FROM report_templates WHERE template_id = ? AND NOT is_default", id))
}

// ---------------- Schedules (HU-ANALYTICS-16) ----------------

func (r *InsightsStore) ListSchedules(ctx context.Context) ([]insightsdomain.ReportSchedule, error) {
	var rows []insightsdomain.ReportSchedule
	err := r.db.WithContext(ctx).Order("created_at DESC").Find(&rows).Error
	return rows, err
}

func (r *InsightsStore) GetSchedule(ctx context.Context, id uuid.UUID) (*insightsdomain.ReportSchedule, error) {
	var s insightsdomain.ReportSchedule
	if err := r.db.WithContext(ctx).First(&s, "schedule_id = ?", id).Error; err != nil {
		return nil, notFound(err)
	}
	return &s, nil
}

func (r *InsightsStore) SaveSchedule(ctx context.Context, s *insightsdomain.ReportSchedule) error {
	if s.ScheduleID == uuid.Nil {
		return r.db.WithContext(ctx).Create(s).Error
	}
	return rowsOrNotFound(r.db.WithContext(ctx).Model(&insightsdomain.ReportSchedule{}).Where("schedule_id = ?", s.ScheduleID).
		Updates(map[string]interface{}{
			"name": s.Name, "report_type": s.ReportType, "format": s.Format, "frequency": s.Frequency,
			"recipients": s.Recipients, "branch_id": s.BranchID, "template_id": s.TemplateID,
			"is_active": s.IsActive, "updated_at": gorm.Expr("NOW()"),
		}))
}

func (r *InsightsStore) DeleteSchedule(ctx context.Context, id uuid.UUID) error {
	return rowsOrNotFound(r.db.WithContext(ctx).Exec("DELETE FROM report_schedules WHERE schedule_id = ?", id))
}

func (r *InsightsStore) GetDueSchedules(ctx context.Context) ([]insightsdomain.ReportSchedule, error) {
	var rows []insightsdomain.ReportSchedule
	err := r.db.WithContext(ctx).Where(`is_active AND (
		last_sent_at IS NULL
		OR (frequency = 'daily' AND last_sent_at < date_trunc('day', NOW()))
		OR (frequency = 'weekly' AND last_sent_at < date_trunc('week', NOW()))
		OR (frequency = 'monthly' AND last_sent_at < date_trunc('month', NOW())))`).Find(&rows).Error
	return rows, err
}

func (r *InsightsStore) MarkScheduleSent(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Exec("UPDATE report_schedules SET last_sent_at = NOW() WHERE schedule_id = ?", id).Error
}

// ---------------- Share links (HU-ANALYTICS-18) ----------------

func (r *InsightsStore) CreateShareLink(ctx context.Context, l *insightsdomain.ReportShareLink) error {
	return r.db.WithContext(ctx).Create(l).Error
}

func (r *InsightsStore) GetShareLink(ctx context.Context, tokenHash string) (*insightsdomain.ReportShareLink, error) {
	var l insightsdomain.ReportShareLink
	if err := r.db.WithContext(ctx).First(&l, "token_hash = ?", tokenHash).Error; err != nil {
		return nil, notFound(err)
	}
	return &l, nil
}

func (r *InsightsStore) IncrementShareLinkAccess(ctx context.Context, tokenHash string) error {
	return r.db.WithContext(ctx).Exec("UPDATE report_share_links SET access_count = access_count + 1 WHERE token_hash = ?", tokenHash).Error
}

func (r *InsightsStore) ListShareLinks(ctx context.Context) ([]insightsdomain.ReportShareLink, error) {
	var rows []insightsdomain.ReportShareLink
	err := r.db.WithContext(ctx).Where("expires_at > NOW()").Order("created_at DESC").Find(&rows).Error
	return rows, err
}

func (r *InsightsStore) DeleteShareLink(ctx context.Context, tokenHash string) error {
	return rowsOrNotFound(r.db.WithContext(ctx).Exec("DELETE FROM report_share_links WHERE token_hash = ?", tokenHash))
}

// ---------------- BI API keys (HU-ANALYTICS-17) ----------------

func (r *InsightsStore) CreateAPIKey(ctx context.Context, k *insightsdomain.BIAPIKey) error {
	return r.db.WithContext(ctx).Create(k).Error
}

func (r *InsightsStore) GetAPIKeyByHash(ctx context.Context, hash string) (*insightsdomain.BIAPIKey, error) {
	var k insightsdomain.BIAPIKey
	err := r.db.WithContext(ctx).
		Where("key_hash = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())", hash).
		First(&k).Error
	if err != nil {
		return nil, notFound(err)
	}
	return &k, nil
}

func (r *InsightsStore) TouchAPIKey(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Exec("UPDATE bi_api_keys SET last_used_at = NOW() WHERE key_id = ?", id).Error
}

func (r *InsightsStore) ListAPIKeys(ctx context.Context) ([]insightsdomain.BIAPIKey, error) {
	var rows []insightsdomain.BIAPIKey
	err := r.db.WithContext(ctx).Order("created_at DESC").Find(&rows).Error
	return rows, err
}

func (r *InsightsStore) RevokeAPIKey(ctx context.Context, id uuid.UUID) error {
	return rowsOrNotFound(r.db.WithContext(ctx).Exec("UPDATE bi_api_keys SET revoked_at = NOW() WHERE key_id = ? AND revoked_at IS NULL", id))
}
