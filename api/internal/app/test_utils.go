package app

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/mock"
	"github.com/vitalfit/api/config"
	apphandlers "github.com/vitalfit/api/internal/app/handlers"
	appservices "github.com/vitalfit/api/internal/app/services"
	auditmocks "github.com/vitalfit/api/internal/modules/audit/mocks"
	authmocks "github.com/vitalfit/api/internal/modules/auth/mocks"
	"github.com/vitalfit/api/internal/shared/notifications"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/internal/store/cache"
	mailermocks "github.com/vitalfit/api/pkg/mailer/mocks"
	"github.com/vitalfit/api/pkg/ratelimiter"
	"go.uber.org/zap"
)

func NewTestApplication(t *testing.T, cfg *config.Config) *application {
	t.Helper()

	logger := zap.NewNop().Sugar()
	// Uncomment to enable logs
	//logger := zap.Must(zap.NewProduction()).Sugar()
	testAuth := &authmocks.TestAuthenticator{}
	mailer := &mailermocks.MockMailer{}
	mockStore := store.NewMockStore()

	// Setup default expectation for Audit.CreateLog to avoid unexpected call panics in middleware
	if mockAudit, ok := mockStore.Audit.(*auditmocks.MockAuditStore); ok {
		mockAudit.On("CreateLog", mock.Anything, mock.Anything).Return(nil).Maybe()
	}

	// Rate limiter
	rateLimiter := ratelimiter.NewFixedWindowLimiter(
		cfg.RateLimiter.RequestsPerTimeFrame,
		cfg.RateLimiter.TimeFrame,
	)

	var rdb *redis.Client
	if cfg.RedisCfg.Enabled {
		rdb = cache.NewRedisClient(cfg.RedisCfg.Addr, cfg.RedisCfg.Username, cfg.RedisCfg.Pw, cfg.RedisCfg.Db)
		logger.Info("redis cache connection established")

		defer rdb.Close()
	}

	cache := cache.NewRedisStorage(rdb)
	pushNoti := notifications.NewMockPushService()

	mockServices := appservices.NewServices(mockStore, logger, *cfg, testAuth, mailer, cache, *pushNoti, nil, nil)
	mockHandlers := apphandlers.NewAppHandlers(mockServices)

	return &application{
		Logger:      logger,
		ratelimiter: rateLimiter,
		Store:       mockStore,
		Services:    mockServices,
		Handlers:    mockHandlers,
		Config:      cfg,
	}
}

func ExecuteRequest(req *http.Request, mux http.Handler) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	return rr
}

func CheckResponseCode(t *testing.T, expected, actual int) {
	if expected != actual {
		t.Errorf("Expected response code %d. Got %d", expected, actual)
	}
}
