package authrepository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

type SecurityStore struct {
	db *gorm.DB
}

func NewSecurityStore(db *gorm.DB) *SecurityStore {
	return &SecurityStore{db: db}
}

func (r *SecurityStore) GetSettings(ctx context.Context) (*authdomain.SecuritySettings, error) {
	var s authdomain.SecuritySettings
	if err := r.db.WithContext(ctx).First(&s, "id = 1").Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *SecurityStore) UpdateSettings(ctx context.Context, s *authdomain.SecuritySettings) error {
	s.ID = 1
	return r.db.WithContext(ctx).Model(&authdomain.SecuritySettings{}).Where("id = 1").
		Updates(map[string]interface{}{
			"min_length":          s.MinLength,
			"require_uppercase":   s.RequireUppercase,
			"require_lowercase":   s.RequireLowercase,
			"require_number":      s.RequireNumber,
			"require_special":     s.RequireSpecial,
			"expiration_days":     s.ExpirationDays,
			"two_factor_required": s.TwoFactorRequired,
			"updated_by":          s.UpdatedBy,
			"updated_at":          gorm.Expr("NOW()"),
		}).Error
}

func (r *SecurityStore) GetPasswordChangedAt(ctx context.Context, userID uuid.UUID) (time.Time, error) {
	var t time.Time
	err := r.db.WithContext(ctx).Raw("SELECT password_changed_at FROM users WHERE user_id = ?", userID).Scan(&t).Error
	return t, err
}

func (r *SecurityStore) CreateChallenge(ctx context.Context, ch *authdomain.TwoFactorChallenge) error {
	return r.db.WithContext(ctx).Create(ch).Error
}

func (r *SecurityStore) GetChallenge(ctx context.Context, id uuid.UUID) (*authdomain.TwoFactorChallenge, error) {
	var ch authdomain.TwoFactorChallenge
	if err := r.db.WithContext(ctx).First(&ch, "challenge_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &ch, nil
}

func (r *SecurityStore) IncrementChallengeAttempts(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Exec("UPDATE two_factor_challenges SET attempts = attempts + 1 WHERE challenge_id = ?", id).Error
}

// ConsumeChallenge marks the challenge as used; returns false if it was already consumed.
func (r *SecurityStore) ConsumeChallenge(ctx context.Context, id uuid.UUID) (bool, error) {
	res := r.db.WithContext(ctx).Exec("UPDATE two_factor_challenges SET consumed_at = NOW() WHERE challenge_id = ? AND consumed_at IS NULL", id)
	return res.RowsAffected == 1, res.Error
}

func (r *SecurityStore) ReplaceChallengeCode(ctx context.Context, id uuid.UUID, codeHash []byte, expiresAt time.Time) error {
	return r.db.WithContext(ctx).Exec(
		"UPDATE two_factor_challenges SET code_hash = ?, expires_at = ?, attempts = 0 WHERE challenge_id = ? AND consumed_at IS NULL",
		codeHash, expiresAt, id).Error
}
