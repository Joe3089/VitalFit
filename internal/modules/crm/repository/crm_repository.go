package crmrepository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	crmdomain "github.com/vitalfit/api/internal/modules/crm/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

type CRMStore struct {
	db *gorm.DB
}

func NewCRMStore(db *gorm.DB) *CRMStore {
	return &CRMStore{db: db}
}

func notFound(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return shared_errors.ErrNotFound
	}
	return err
}

func offset(limit, page int) int {
	if page < 1 {
		page = 1
	}
	return (page - 1) * limit
}

// ---------------- Feedback ----------------

func (r *CRMStore) CreateFeedback(ctx context.Context, f *crmdomain.ClientFeedback) error {
	return r.db.WithContext(ctx).Create(f).Error
}

func (r *CRMStore) GetFeedbackByID(ctx context.Context, id uuid.UUID) (*crmdomain.ClientFeedback, error) {
	var f crmdomain.ClientFeedback
	if err := r.db.WithContext(ctx).First(&f, "feedback_id = ?", id).Error; err != nil {
		return nil, notFound(err)
	}
	return &f, nil
}

func (r *CRMStore) UpdateFeedback(ctx context.Context, f *crmdomain.ClientFeedback) error {
	return r.db.WithContext(ctx).Model(&crmdomain.ClientFeedback{}).
		Where("feedback_id = ?", f.FeedbackID).
		Updates(map[string]interface{}{
			"status":           f.Status,
			"resolution_notes": f.ResolutionNotes,
			"resolved_by":      f.ResolvedBy,
			"resolved_at":      f.ResolvedAt,
			"updated_at":       gorm.Expr("NOW()"),
		}).Error
}

func (r *CRMStore) ListFeedback(ctx context.Context, filter crmdomain.FeedbackFilter) ([]crmdomain.FeedbackView, int64, error) {
	q := r.db.WithContext(ctx).Table("client_feedback f").
		Joins("JOIN users u ON u.user_id = f.user_id").
		Joins("LEFT JOIN branch b ON b.branch_id = f.branch_id")
	if filter.UserID != nil {
		q = q.Where("f.user_id = ?", *filter.UserID)
	}
	if filter.BranchID != nil {
		q = q.Where("f.branch_id = ?", *filter.BranchID)
	}
	if filter.Status != "" {
		q = q.Where("f.status = ?", filter.Status)
	}
	if filter.Type != "" {
		q = q.Where("f.type = ?", filter.Type)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []crmdomain.FeedbackView
	err := q.Select(`f.*, u.first_name || ' ' || u.last_name AS client_name, u.email AS client_email, COALESCE(b.name, '') AS branch_name`).
		Order("f.created_at DESC").
		Limit(filter.Limit).Offset(offset(filter.Limit, filter.Page)).
		Scan(&rows).Error
	return rows, total, err
}

// ---------------- Tags ----------------

func (r *CRMStore) ListTags(ctx context.Context) ([]crmdomain.TagWithCount, error) {
	var tags []crmdomain.TagWithCount
	err := r.db.WithContext(ctx).Raw(`
		SELECT t.*, COUNT(a.user_id) AS client_count
		FROM client_tags t
		LEFT JOIN client_tag_assignments a ON a.tag_id = t.tag_id
		GROUP BY t.tag_id
		ORDER BY t.name`).Scan(&tags).Error
	return tags, err
}

func (r *CRMStore) CreateTag(ctx context.Context, tag *crmdomain.ClientTag) error {
	err := r.db.WithContext(ctx).Create(tag).Error
	if err != nil && (errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(err.Error(), "23505")) {
		return shared_errors.ErrConflict
	}
	return err
}

func (r *CRMStore) DeleteTag(ctx context.Context, tagID uuid.UUID) error {
	res := r.db.WithContext(ctx).Delete(&crmdomain.ClientTag{}, "tag_id = ?", tagID)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}
	return nil
}

func (r *CRMStore) GetClientTags(ctx context.Context, userID uuid.UUID) ([]crmdomain.ClientTag, error) {
	var tags []crmdomain.ClientTag
	err := r.db.WithContext(ctx).Table("client_tags t").
		Select("t.*").
		Joins("JOIN client_tag_assignments a ON a.tag_id = t.tag_id").
		Where("a.user_id = ?", userID).
		Order("t.name").
		Scan(&tags).Error
	return tags, err
}

func (r *CRMStore) AssignTag(ctx context.Context, userID, tagID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Exec("INSERT INTO client_tag_assignments (user_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING", userID, tagID).Error
}

func (r *CRMStore) UnassignTag(ctx context.Context, userID, tagID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Exec("DELETE FROM client_tag_assignments WHERE user_id = ? AND tag_id = ?", userID, tagID).Error
}

func (r *CRMStore) GetClientIDsByTag(ctx context.Context, tagID uuid.UUID) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := r.db.WithContext(ctx).Raw("SELECT user_id FROM client_tag_assignments WHERE tag_id = ?", tagID).Scan(&ids).Error
	return ids, err
}

// ---------------- Scoring & segmentation ----------------

// scoreCTE computes, per client profile, the score components:
//   - frequency (55 pts): attended check-ins in the last 90 days, capped at 36 (~3/week)
//   - punctuality (45 pts): share of non-void invoices of the last 12 months fully
//     paid on or before their due date; clients without invoices get a neutral 50%.
//
// Referrals are not tracked by the platform (the referral program was descoped),
// so they currently contribute 0 points.
const scoreCTE = `
WITH visits AS (
	SELECT user_id, COUNT(*) AS v
	FROM attendance_log
	WHERE check_in_time >= NOW() - INTERVAL '90 days' AND status = 'Attended'
	GROUP BY user_id
), inv AS (
	SELECT i.user_id,
		COUNT(*) AS total,
		COUNT(*) FILTER (
			WHERE i.status = 'Paid' AND (
				SELECT MAX(p.payment_date)::date FROM payments p
				WHERE p.invoice_id = i.invoice_id AND p.status = 'Completed' AND p.deleted_at IS NULL
			) <= i.due_date
		) AS on_time
	FROM invoices i
	WHERE i.deleted_at IS NULL AND i.status <> 'Void' AND i.issue_date >= NOW() - INTERVAL '12 months'
	GROUP BY i.user_id
), scored AS (
	SELECT cp.user_id,
		COALESCE(v.v, 0) AS visits_90d,
		COALESCE(inv.total, 0) AS invoices_total,
		COALESCE(inv.on_time, 0) AS invoices_on_time,
		LEAST(COALESCE(v.v, 0), 36)::numeric / 36 * 55 AS frequency_score,
		CASE WHEN COALESCE(inv.total, 0) = 0 THEN 22.5
			ELSE inv.on_time::numeric / inv.total * 45 END AS punctuality_score,
		cp.category::text AS category
	FROM client_profiles cp
	LEFT JOIN visits v ON v.user_id = cp.user_id
	LEFT JOIN inv ON inv.user_id = cp.user_id
	%s
)`

func (r *CRMStore) RecalculateScores(ctx context.Context) (int64, error) {
	query := fmt.Sprintf(scoreCTE, "") + `
		UPDATE client_profiles cp
		SET scoring = ROUND(s.frequency_score + s.punctuality_score)::int, updated_at = NOW()
		FROM scored s
		WHERE s.user_id = cp.user_id AND cp.scoring IS DISTINCT FROM ROUND(s.frequency_score + s.punctuality_score)::int`
	res := r.db.WithContext(ctx).Exec(query)
	return res.RowsAffected, res.Error
}

// RecalculateSegments classifies clients. "AtRisk" is owned by the churn
// detection job and is preserved; the rest are New / VIP / Regular.
func (r *CRMStore) RecalculateSegments(ctx context.Context, newClientDays, vipMinScore int) (int64, error) {
	res := r.db.WithContext(ctx).Exec(`
		UPDATE client_profiles cp
		SET category = s.cat::client_category, updated_at = NOW()
		FROM (
			SELECT cp.user_id,
				CASE
					WHEN cp.category = 'AtRisk' THEN 'AtRisk'
					WHEN u.created_at >= NOW() - make_interval(days => ?) THEN 'New'
					WHEN cp.scoring >= ? THEN 'VIP'
					ELSE 'Regular'
				END AS cat
			FROM client_profiles cp
			JOIN users u ON u.user_id = cp.user_id
			WHERE u.deleted_at IS NULL
		) s
		WHERE s.user_id = cp.user_id AND cp.category::text <> s.cat`, newClientDays, vipMinScore)
	return res.RowsAffected, res.Error
}

func (r *CRMStore) GetClientScore(ctx context.Context, userID uuid.UUID) (*crmdomain.ClientScoreBreakdown, error) {
	var b crmdomain.ClientScoreBreakdown
	query := fmt.Sprintf(scoreCTE, "WHERE cp.user_id = @uid") + `
		SELECT user_id, visits_90d, invoices_total, invoices_on_time,
			ROUND(frequency_score, 1) AS frequency_score,
			ROUND(punctuality_score, 1) AS punctuality_score,
			0 AS referral_score,
			ROUND(frequency_score + punctuality_score)::int AS score,
			category
		FROM scored`
	res := r.db.WithContext(ctx).Raw(query, map[string]interface{}{"uid": userID}).Scan(&b)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, shared_errors.ErrNotFound
	}
	return &b, nil
}

func (r *CRMStore) GetSegmentCounts(ctx context.Context, branchID *uuid.UUID) ([]crmdomain.SegmentCount, error) {
	var rows []crmdomain.SegmentCount
	q := `
		SELECT cp.category::text AS category, COUNT(*) AS total
		FROM client_profiles cp
		JOIN users u ON u.user_id = cp.user_id AND u.deleted_at IS NULL`
	args := []interface{}{}
	if branchID != nil {
		q += `
		WHERE EXISTS (SELECT 1 FROM attendance_log al WHERE al.user_id = cp.user_id AND al.branch_id = ?)
		   OR EXISTS (SELECT 1 FROM invoices i WHERE i.user_id = cp.user_id AND i.branch_id = ?)`
		args = append(args, *branchID, *branchID)
	}
	q += " GROUP BY cp.category ORDER BY total DESC"
	err := r.db.WithContext(ctx).Raw(q, args...).Scan(&rows).Error
	return rows, err
}

// ---------------- NPS & contact ----------------

func (r *CRMStore) CreateNPSResponse(ctx context.Context, n *crmdomain.NPSResponse) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *CRMStore) CreateContactMessage(ctx context.Context, m *crmdomain.ContactMessage) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *CRMStore) ListContactMessages(ctx context.Context, status string, limit, page int) ([]crmdomain.ContactMessage, int64, error) {
	q := r.db.WithContext(ctx).Model(&crmdomain.ContactMessage{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []crmdomain.ContactMessage
	err := q.Order("created_at DESC").Limit(limit).Offset(offset(limit, page)).Find(&rows).Error
	return rows, total, err
}

func (r *CRMStore) UpdateContactMessageStatus(ctx context.Context, id uuid.UUID, status string) error {
	res := r.db.WithContext(ctx).Model(&crmdomain.ContactMessage{}).Where("message_id = ?", id).Update("status", status)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}
	return nil
}
