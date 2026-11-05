package authservices

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/mailer"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

const (
	twoFactorCodeTTL     = 10 * time.Minute
	twoFactorMaxAttempts = 5
)

type SecurityService struct {
	store  store.Storage
	cfg    config.Config
	mailer mailer.Client
	logger *zap.SugaredLogger
}

func NewSecurityService(store store.Storage, cfg config.Config, mailer mailer.Client, logger *zap.SugaredLogger) *SecurityService {
	return &SecurityService{store: store, cfg: cfg, mailer: mailer, logger: logger}
}

// GetSettings never fails: if the settings row cannot be read the built-in
// defaults are returned so authentication keeps working.
func (s *SecurityService) GetSettings(ctx context.Context) authdomain.SecuritySettings {
	if s.store.Security == nil {
		return authdomain.DefaultSecuritySettings()
	}
	settings, err := s.store.Security.GetSettings(ctx)
	if err != nil {
		if s.logger != nil {
			s.logger.Warnw("could not load security settings, using defaults", "error", err)
		}
		return authdomain.DefaultSecuritySettings()
	}
	return *settings
}

func (s *SecurityService) UpdateSettings(ctx context.Context, settings *authdomain.SecuritySettings, actorID uuid.UUID) error {
	if settings.MinLength < 6 || settings.MinLength > 72 {
		return fmt.Errorf("min_length must be between 6 and 72")
	}
	if settings.ExpirationDays < 0 || settings.ExpirationDays > 3650 {
		return fmt.Errorf("expiration_days must be between 0 and 3650")
	}
	settings.UpdatedBy = &actorID
	return s.store.Security.UpdateSettings(ctx, settings)
}

func (s *SecurityService) ValidatePassword(ctx context.Context, password string) error {
	return s.GetSettings(ctx).ValidatePassword(password)
}

func (s *SecurityService) IsPasswordExpired(ctx context.Context, userID uuid.UUID) bool {
	settings := s.GetSettings(ctx)
	if settings.ExpirationDays <= 0 || s.store.Security == nil {
		return false
	}
	changedAt, err := s.store.Security.GetPasswordChangedAt(ctx, userID)
	if err != nil {
		return false
	}
	return settings.IsPasswordExpired(changedAt)
}

func generateNumericCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func (s *SecurityService) sendCode(user *authdomain.Users, code string) error {
	data := struct {
		UserName string
		Code     string
		Minutes  int
	}{
		UserName: user.FirstName,
		Code:     code,
		Minutes:  int(twoFactorCodeTTL.Minutes()),
	}
	_, err := s.mailer.Send(mailer.TwoFactorCodeTemplate, user.FirstName, user.Email, data, s.cfg.Env != "production")
	return err
}

func (s *SecurityService) StartTwoFactor(ctx context.Context, user *authdomain.Users, deviceToken string) (*authdomain.TwoFactorChallenge, error) {
	code, err := generateNumericCode()
	if err != nil {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	ch := &authdomain.TwoFactorChallenge{
		UserID:      user.UserID,
		CodeHash:    hash,
		DeviceToken: deviceToken,
		ExpiresAt:   time.Now().Add(twoFactorCodeTTL),
	}
	if err := s.store.Security.CreateChallenge(ctx, ch); err != nil {
		return nil, err
	}
	if err := s.sendCode(user, code); err != nil {
		return nil, fmt.Errorf("could not send verification code: %w", err)
	}
	return ch, nil
}

func (s *SecurityService) ResendTwoFactor(ctx context.Context, challengeID uuid.UUID) error {
	ch, err := s.store.Security.GetChallenge(ctx, challengeID)
	if err != nil {
		return err
	}
	if ch.ConsumedAt != nil {
		return authdomain.ErrTwoFactorInvalid
	}
	user, err := s.store.Users.GetByID(ctx, ch.UserID)
	if err != nil {
		return err
	}
	code, err := generateNumericCode()
	if err != nil {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := s.store.Security.ReplaceChallengeCode(ctx, challengeID, hash, time.Now().Add(twoFactorCodeTTL)); err != nil {
		return err
	}
	return s.sendCode(user, code)
}

// VerifyTwoFactor validates the code and consumes the challenge. The returned
// challenge carries the user id and the device token captured at login.
func (s *SecurityService) VerifyTwoFactor(ctx context.Context, challengeID uuid.UUID, code string) (*authdomain.TwoFactorChallenge, error) {
	ch, err := s.store.Security.GetChallenge(ctx, challengeID)
	if err != nil {
		return nil, authdomain.ErrTwoFactorInvalid
	}
	if ch.ConsumedAt != nil || time.Now().After(ch.ExpiresAt) {
		return nil, authdomain.ErrTwoFactorInvalid
	}
	if ch.Attempts >= twoFactorMaxAttempts {
		return nil, authdomain.ErrTwoFactorAttempts
	}
	if bcrypt.CompareHashAndPassword(ch.CodeHash, []byte(code)) != nil {
		if err := s.store.Security.IncrementChallengeAttempts(ctx, challengeID); err != nil {
			return nil, err
		}
		return nil, authdomain.ErrTwoFactorInvalid
	}
	ok, err := s.store.Security.ConsumeChallenge(ctx, challengeID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, authdomain.ErrTwoFactorInvalid
	}
	return ch, nil
}
