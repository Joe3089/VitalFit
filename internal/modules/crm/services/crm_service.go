package crmservices

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	crmdomain "github.com/vitalfit/api/internal/modules/crm/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
)

const (
	// Clients registered within this window are classified as "New".
	newClientDays = 30
	// Minimum score (0-100) to be classified as "VIP".
	vipMinScore = 80
)

var hexColor = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

type CRMService struct {
	store store.Storage
}

func NewCRMService(store store.Storage) *CRMService {
	return &CRMService{store: store}
}

func validFeedbackStatus(s crmdomain.FeedbackStatus) bool {
	switch s {
	case crmdomain.FeedbackOpen, crmdomain.FeedbackInProgress, crmdomain.FeedbackResolved, crmdomain.FeedbackClosed:
		return true
	}
	return false
}

func (s *CRMService) CreateFeedback(ctx context.Context, f *crmdomain.ClientFeedback) error {
	switch f.Type {
	case crmdomain.FeedbackComplaint, crmdomain.FeedbackSuggestion, crmdomain.FeedbackCompliment:
	default:
		return errors.New("invalid feedback type")
	}
	f.Status = crmdomain.FeedbackOpen
	return s.store.CRM.CreateFeedback(ctx, f)
}

func (s *CRMService) UpdateFeedbackStatus(ctx context.Context, id uuid.UUID, status crmdomain.FeedbackStatus, notes string, actorID uuid.UUID) (*crmdomain.ClientFeedback, error) {
	if !validFeedbackStatus(status) {
		return nil, errors.New("invalid feedback status")
	}
	f, err := s.store.CRM.GetFeedbackByID(ctx, id)
	if err != nil {
		return nil, err
	}
	f.Status = status
	if notes != "" {
		f.ResolutionNotes = notes
	}
	if status == crmdomain.FeedbackResolved || status == crmdomain.FeedbackClosed {
		if strings.TrimSpace(f.ResolutionNotes) == "" {
			return nil, errors.New("resolution notes are required to resolve or close feedback")
		}
		now := time.Now()
		f.ResolvedAt = &now
		f.ResolvedBy = &actorID
	} else {
		f.ResolvedAt = nil
		f.ResolvedBy = nil
	}
	if err := s.store.CRM.UpdateFeedback(ctx, f); err != nil {
		return nil, err
	}
	return f, nil
}

func (s *CRMService) ListFeedback(ctx context.Context, filter crmdomain.FeedbackFilter) ([]crmdomain.FeedbackView, int64, error) {
	return s.store.CRM.ListFeedback(ctx, filter)
}

func (s *CRMService) ListTags(ctx context.Context) ([]crmdomain.TagWithCount, error) {
	return s.store.CRM.ListTags(ctx)
}

func (s *CRMService) CreateTag(ctx context.Context, name, color string) (*crmdomain.ClientTag, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("tag name is required")
	}
	if color == "" {
		color = "#f58a24"
	}
	if !hexColor.MatchString(color) {
		return nil, errors.New("color must be a hex value like #f58a24")
	}
	tag := &crmdomain.ClientTag{Name: name, Color: color}
	if err := s.store.CRM.CreateTag(ctx, tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *CRMService) DeleteTag(ctx context.Context, tagID uuid.UUID) error {
	return s.store.CRM.DeleteTag(ctx, tagID)
}

func (s *CRMService) GetClientTags(ctx context.Context, userID uuid.UUID) ([]crmdomain.ClientTag, error) {
	return s.store.CRM.GetClientTags(ctx, userID)
}

func (s *CRMService) AssignTag(ctx context.Context, userID, tagID uuid.UUID) error {
	user, err := s.store.Users.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.Role.Name != "client" {
		return shared_errors.ErrBadRequest
	}
	return s.store.CRM.AssignTag(ctx, userID, tagID)
}

func (s *CRMService) UnassignTag(ctx context.Context, userID, tagID uuid.UUID) error {
	return s.store.CRM.UnassignTag(ctx, userID, tagID)
}

func (s *CRMService) RecalculateScoresAndSegments(ctx context.Context) (int64, int64, error) {
	scored, err := s.store.CRM.RecalculateScores(ctx)
	if err != nil {
		return 0, 0, err
	}
	segmented, err := s.store.CRM.RecalculateSegments(ctx, newClientDays, vipMinScore)
	return scored, segmented, err
}

func (s *CRMService) GetClientScore(ctx context.Context, userID uuid.UUID) (*crmdomain.ClientScoreBreakdown, error) {
	b, err := s.store.CRM.GetClientScore(ctx, userID)
	if err != nil {
		return nil, err
	}
	b.ScoringWeightNote = "frequency 55% (check-ins last 90 days), payment punctuality 45% (invoices last 12 months), referrals 0% (not tracked)"
	return b, nil
}

func (s *CRMService) GetSegmentCounts(ctx context.Context, branchID *uuid.UUID) ([]crmdomain.SegmentCount, error) {
	return s.store.CRM.GetSegmentCounts(ctx, branchID)
}

func (s *CRMService) SubmitNPS(ctx context.Context, r *crmdomain.NPSResponse) error {
	if r.Score < 0 || r.Score > 10 {
		return errors.New("score must be between 0 and 10")
	}
	switch r.Channel {
	case "web", "mobile", "dashboard":
	case "":
		r.Channel = "web"
	default:
		return errors.New("invalid channel")
	}
	return s.store.CRM.CreateNPSResponse(ctx, r)
}

func (s *CRMService) SubmitContactMessage(ctx context.Context, m *crmdomain.ContactMessage) error {
	m.Status = "new"
	return s.store.CRM.CreateContactMessage(ctx, m)
}

func (s *CRMService) ListContactMessages(ctx context.Context, status string, limit, page int) ([]crmdomain.ContactMessage, int64, error) {
	return s.store.CRM.ListContactMessages(ctx, status, limit, page)
}

func (s *CRMService) UpdateContactMessageStatus(ctx context.Context, id uuid.UUID, status string) error {
	switch status {
	case "new", "read", "answered":
	default:
		return errors.New("invalid status")
	}
	return s.store.CRM.UpdateContactMessageStatus(ctx, id, status)
}
