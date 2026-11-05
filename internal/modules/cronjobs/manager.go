package cronjobs

import (
	"github.com/robfig/cron/v3"
	"github.com/vitalfit/api/config"
	appservices "github.com/vitalfit/api/internal/app/services"
	noti "github.com/vitalfit/api/internal/shared/notifications"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/internal/store/cache"
	"github.com/vitalfit/api/pkg/mailer"
	"go.uber.org/zap"
)

type Manager struct {
	cron        *cron.Cron
	store       store.Storage
	config      config.Config
	appservices appservices.Services
	Mailer      mailer.Client
	cache       cache.Storage
	push        noti.PushService
	logger      *zap.SugaredLogger
}

func NewManager(store store.Storage, appservices appservices.Services, Mailer mailer.Client, logger *zap.SugaredLogger, cache cache.Storage, noti noti.PushService, config config.Config) *Manager {
	return &Manager{
		cron:        cron.New(),
		store:       store,
		appservices: appservices,
		cache:       cache,
		push:        noti,
		logger:      logger,
		Mailer:      Mailer,
		config:      config,
	}
}

func (m *Manager) Start() {
	m.logger.Info("Initializing Cronjobs...")

	m.registerRoutes()

	m.cron.Start()

	m.logger.Info("Cronjobs running in background")
}

func (m *Manager) Stop() {
	m.cron.Stop()
	m.logger.Info("Cronjobs stopped")
}

func (m *Manager) registerRoutes() {
	var err error
	_, err = m.cron.AddFunc("@every 2h2s", m.GetRatesCronjob)
	if err != nil {
		m.logger.Errorw("Error getting rates cronjob", "error", err)
	}
	_, err = m.cron.AddFunc("@daily", m.UpdateExpiredMembershipsCronjob)
	if err != nil {
		m.logger.Errorw("Error registering update expired memberships cronjob", "error", err)
	}
	//todo modify to every 10(min) before merging to dev
	_, err = m.cron.AddFunc("@every 10m", m.NotifyClassReminder)
	if err != nil {
		m.logger.Errorw("Error notifying class reminder ronjobs", "error", err)
	}
	_, err = m.cron.AddFunc("@daily", m.MembershipExpiringNotification)
	if err != nil {
		m.logger.Errorw("Error on membership expiring cronjob", "error", err)
	}

	_, err = m.cron.AddFunc("0 4 * * *", m.NotifChurn)
	if err != nil {
		m.logger.Errorw("Error on churn risk cronjob", "error", err)
	}

	_, err = m.cron.AddFunc("@daily", m.UpdateClientScoresCronjob)
	if err != nil {
		m.logger.Errorw("Error on update client scores cronjob", "error", err)
	}

	_, err = m.cron.AddFunc("0 6 * * *", m.DetectKPIAnomaliesCronjob)
	if err != nil {
		m.logger.Errorw("Error on kpi anomalies cronjob", "error", err)
	}

	_, err = m.cron.AddFunc("@hourly", m.SendScheduledReportsCronjob)
	if err != nil {
		m.logger.Errorw("Error on scheduled reports cronjob", "error", err)
	}
}
