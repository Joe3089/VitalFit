package authdomain

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
)

// SecuritySettings is a single-row table holding the password policy (HU-ADMIN-07)
// and whether 2FA is mandatory for administrative users (HU-ADMIN-03).
type SecuritySettings struct {
	ID                int16      `gorm:"primaryKey" json:"-"`
	MinLength         int        `gorm:"column:min_length" json:"min_length"`
	RequireUppercase  bool       `json:"require_uppercase"`
	RequireLowercase  bool       `json:"require_lowercase"`
	RequireNumber     bool       `json:"require_number"`
	RequireSpecial    bool       `json:"require_special"`
	ExpirationDays    int        `json:"expiration_days"`
	TwoFactorRequired bool       `gorm:"column:two_factor_required" json:"two_factor_required"`
	UpdatedBy         *uuid.UUID `gorm:"type:uuid" json:"updated_by"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

func (SecuritySettings) TableName() string { return "security_settings" }

// DefaultSecuritySettings mirrors the rules that were hard-coded in the request
// validators before the policy became configurable.
func DefaultSecuritySettings() SecuritySettings {
	return SecuritySettings{
		ID:                1,
		MinLength:         8,
		RequireUppercase:  true,
		RequireLowercase:  false,
		RequireNumber:     true,
		RequireSpecial:    true,
		ExpirationDays:    0,
		TwoFactorRequired: false,
	}
}

var ErrPasswordPolicy = errors.New("password does not satisfy the password policy")

// ValidatePassword checks a plaintext password against the policy and returns
// an error listing every unmet rule.
func (s SecuritySettings) ValidatePassword(password string) error {
	var upper, lower, number, special bool
	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			upper = true
		case unicode.IsLower(r):
			lower = true
		case unicode.IsDigit(r):
			number = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			special = true
		}
	}
	var missing []string
	if len([]rune(password)) < s.MinLength {
		missing = append(missing, fmt.Sprintf("at least %d characters", s.MinLength))
	}
	if s.RequireUppercase && !upper {
		missing = append(missing, "an uppercase letter")
	}
	if s.RequireLowercase && !lower {
		missing = append(missing, "a lowercase letter")
	}
	if s.RequireNumber && !number {
		missing = append(missing, "a number")
	}
	if s.RequireSpecial && !special {
		missing = append(missing, "a special character")
	}
	if len(missing) > 0 {
		return fmt.Errorf("%w: must contain %s", ErrPasswordPolicy, strings.Join(missing, ", "))
	}
	return nil
}

// IsPasswordExpired reports whether a password changed at changedAt is expired.
func (s SecuritySettings) IsPasswordExpired(changedAt time.Time) bool {
	if s.ExpirationDays <= 0 || changedAt.IsZero() {
		return false
	}
	return time.Since(changedAt) > time.Duration(s.ExpirationDays)*24*time.Hour
}

type TwoFactorChallenge struct {
	ChallengeID uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"challenge_id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	CodeHash    []byte     `gorm:"type:bytea;not null" json:"-"`
	DeviceToken string     `gorm:"type:text" json:"-"`
	Attempts    int        `gorm:"type:smallint;not null;default:0" json:"-"`
	ConsumedAt  *time.Time `json:"-"`
	ExpiresAt   time.Time  `json:"expires_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (TwoFactorChallenge) TableName() string { return "two_factor_challenges" }

var (
	ErrTwoFactorInvalid  = errors.New("invalid or expired verification code")
	ErrTwoFactorAttempts = errors.New("too many invalid attempts, request a new code")
)

type SecurityRepository interface {
	GetSettings(ctx context.Context) (*SecuritySettings, error)
	UpdateSettings(ctx context.Context, s *SecuritySettings) error
	GetPasswordChangedAt(ctx context.Context, userID uuid.UUID) (time.Time, error)
	CreateChallenge(ctx context.Context, ch *TwoFactorChallenge) error
	GetChallenge(ctx context.Context, id uuid.UUID) (*TwoFactorChallenge, error)
	IncrementChallengeAttempts(ctx context.Context, id uuid.UUID) error
	ConsumeChallenge(ctx context.Context, id uuid.UUID) (bool, error)
	ReplaceChallengeCode(ctx context.Context, id uuid.UUID, codeHash []byte, expiresAt time.Time) error
}

type SecurityServiceInterface interface {
	GetSettings(ctx context.Context) SecuritySettings
	UpdateSettings(ctx context.Context, s *SecuritySettings, actorID uuid.UUID) error
	ValidatePassword(ctx context.Context, password string) error
	IsPasswordExpired(ctx context.Context, userID uuid.UUID) bool
	StartTwoFactor(ctx context.Context, user *Users, deviceToken string) (*TwoFactorChallenge, error)
	ResendTwoFactor(ctx context.Context, challengeID uuid.UUID) error
	VerifyTwoFactor(ctx context.Context, challengeID uuid.UUID, code string) (*TwoFactorChallenge, error)
}
