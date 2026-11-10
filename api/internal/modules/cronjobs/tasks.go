package cronjobs

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	reportdomain "github.com/vitalfit/api/internal/modules/reports/domain"
	"github.com/vitalfit/api/pkg/mailer"
)

func (m *Manager) GetRatesCronjob() {
	m.logger.Info("running get currency rates cronjob")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rates, err := m.appservices.BillingServices.GetLatestRates(ctx)
	if err != nil {
		m.logger.Errorw("failed to get rates", "error", err)
		return
	}
	if len(rates) == 0 {
		m.logger.Warn("rates map is empty")
		return
	}
}

func (m *Manager) UpdateExpiredMembershipsCronjob() {
	m.logger.Info("running update expired memberships cronjob")
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()

	if err := m.appservices.MembershipServices.UpdateExpiredMemberships(ctx); err != nil {
		m.logger.Errorw("failed to update expired memberships", "error", err)
		return
	}
}

func (m *Manager) NotifChurn() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	newRisks, allRisks, err := m.appservices.ReportServices.DetectAndFlagChurnRisk(ctx)
	if err != nil {
		m.logger.Errorw("failed to detect and flag churn risk", "error", err)
		return
	}
	m.logger.Infow("new risks", "new risks", newRisks)
	m.logger.Infow("all risks", "all risks", allRisks)

	var usersToNotify []reportdomain.ChurnRiskAnalysis
	isMonday := time.Now().Weekday() == time.Monday

	if isMonday {
		usersToNotify = allRisks
	} else {
		usersToNotify = allRisks
	}

	if len(usersToNotify) == 0 {
		return
	}

	managerPackages := make(map[string][]reportdomain.ChurnRiskAnalysis)
	managerIDs := make(map[string]uuid.UUID)

	for _, user := range usersToNotify {
		if user.ManagerEmail == "" {
			continue
		}
		managerPackages[user.ManagerEmail] = append(managerPackages[user.ManagerEmail], user)
		if user.ManagerID != nil {
			managerIDs[user.ManagerEmail] = *user.ManagerID
		}
	}

	var notifications []notidomain.Notification

	for email, users := range managerPackages {
		data := struct {
			ManagerName string
			Count       int
			Date        string
			Users       []reportdomain.ChurnRiskAnalysis
		}{
			ManagerName: "Manager",
			Count:       len(users),
			Date:        time.Now().Format("02 Jan 2006"),
			Users:       users,
		}

		isProdEnv := m.config.Env == "production"
		if _, err := m.Mailer.Send("churn_risk_alert.tmpl", "Manager", email, data, !isProdEnv); err != nil {
			m.logger.Errorw("failed to send churn risk email", "email", email, "error", err)
		} else {
			if managerID, ok := managerIDs[email]; ok {
				pushTitle := "Alerta de Riesgo"
				pushBody := fmt.Sprintf("Detectamos %d clientes en riesgo hoy. Revisa tu correo.", len(users))

				notifications = append(notifications, notidomain.Notification{
					UserID:  managerID,
					Title:   pushTitle,
					Message: pushBody,
					Type:    "churn_risk",
					IsRead:  false,
				})

			}
		}
	}

	if len(notifications) > 0 {
		if err := m.appservices.NotificationServices.CreateBatchNotifications(ctx, notifications); err != nil {
			m.logger.Errorw("failed to create batch notifications", "error", err)
		}
	}
}

func (m *Manager) NotifyClassReminder() {
	m.logger.Info("running notify class reminder cronjob")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	BookingRemind, err := m.appservices.BookingServices.GetUpcomingClassReminders(ctx)
	if err != nil {
		m.logger.Errorw("failed to get upcoming class reminders", "error", err)
		return
	}
	if len(BookingRemind) == 0 {
		m.logger.Warn("BookingRemind is empty")
		return
	}
	var notifications []notidomain.Notification
	for _, booking := range BookingRemind {
		var notification notidomain.Notification
		notification.UserID = booking.UserID
		notification.Title = fmt.Sprintf("Class Reminder %s", booking.ServiceName)
		notification.Message = fmt.Sprintf("Your %s class starts in %v", booking.ServiceName, booking.TimeUntilStart)
		notification.Type = string(notidomain.ClassReminder)
		notification.IsRead = false
		metadata, err := m.push.ConvertStructToDataMap(booking)
		if err != nil {
			m.logger.Errorw("error converting metadata")
		}
		metaInterface := make(map[string]interface{}, len(metadata))
		for k, v := range metadata {
			metaInterface[k] = v
		}
		notification.Metadata = metaInterface
		sentTokens := make(map[string]struct{})
		session, err := m.store.Session.GetUserSessions(ctx, booking.UserID)
		if err != nil {
			m.logger.Errorw("failed to get user sessions")
		}
		for _, ses := range session {
			if ses.DeviceToken == "" {
				continue
			}
			if _, exists := sentTokens[ses.DeviceToken]; exists {
				continue
			}
			sentTokens[ses.DeviceToken] = struct{}{}
			err := m.push.SendPush(ctx, ses.DeviceToken, fmt.Sprintf("Class Reminder %s", booking.ServiceName), fmt.Sprintf("Your %s class starts in %v", booking.ServiceName, booking.TimeUntilStart), metadata)
			if err != nil {
				m.logger.Errorw("failed to send push notification", "error", err)
				continue
			}
		}
		notifications = append(notifications, notification)
	}
	if err := m.appservices.NotificationServices.CreateBatchNotifications(ctx, notifications); err != nil {
		m.logger.Errorw("failed to create batch notifications", "error", err)
		return
	}
	m.logger.Infow("notifications", "notifications", notifications)

}

func (m *Manager) MembershipExpiringNotification() {
	m.logger.Info("running membership expiring cronjob")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	memberships, err := m.appservices.MembershipServices.GetExpiringMemberships(ctx, 3)
	if err != nil {
		m.logger.Errorw("failed to get expiring memberships", "error", err)
		return
	}
	if len(memberships) == 0 {
		m.logger.Warn("memberships is empty")
		return
	}
	var notifications []notidomain.Notification
	for _, membership := range memberships {
		var notification notidomain.Notification
		notification.UserID = membership.UserID
		notification.Title = fmt.Sprintf("%s Expiring ", membership.MembershipName)
		notification.Message = fmt.Sprintf("Your memberships %s is expiring in %d days", membership.MembershipName, membership.DaysRemaining)
		notification.Type = string(notidomain.MembershipExpiring)
		notification.IsRead = false
		metadata, err := m.push.ConvertStructToDataMap(membership)
		if err != nil {
			m.logger.Errorw("error converting metadata")
		}
		metaInterface := make(map[string]interface{}, len(metadata))
		for k, v := range metadata {
			metaInterface[k] = v
		}
		notification.Metadata = metaInterface

		mem := membership
		go func() {
			renewalURL := fmt.Sprintf("%s/en/memberships", m.config.FrontURLE)
			isProdEnv := m.config.Env == "production"

			data := struct {
				UserName       string
				MembershipName string
				DaysRemaining  int
				RenewalURL     string
			}{
				UserName:       mem.UserName,
				MembershipName: mem.MembershipName,
				DaysRemaining:  mem.DaysRemaining,
				RenewalURL:     renewalURL,
			}

			if _, err := m.Mailer.Send(mailer.MembershipExpiring, mem.UserName, mem.UserEmail, data, !isProdEnv); err != nil {
				m.logger.Errorw("failed to send membership expiring email", "error", err)
			}
		}()
		notifications = append(notifications, notification)
	}
	if len(notifications) > 0 {
		if err := m.appservices.NotificationServices.CreateBatchNotifications(ctx, notifications); err != nil {
			m.logger.Errorw("failed to create batch notifications", "error", err)
		}
	}
	m.logger.Infow("memberships", "memberships", memberships)
}

func (m *Manager) UpdateClientScoresCronjob() {
	m.logger.Info("running update client scores cronjob")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Score 0-100 (frequency + payment punctuality) followed by automatic
	// segmentation into New / VIP / Regular (AtRisk is owned by NotifChurn).
	scored, segmented, err := m.appservices.CRMServices.RecalculateScoresAndSegments(ctx)
	if err != nil {
		m.logger.Errorw("failed to recalculate client scores and segments", "error", err)
		return
	}
	m.logger.Infow("client scores updated", "scored", scored, "segmented", segmented)
}

// DetectKPIAnomaliesCronjob flags unusual daily revenue / check-ins (HU-ANALYTICS-19).
func (m *Manager) DetectKPIAnomaliesCronjob() {
	m.logger.Info("running kpi anomaly detection cronjob")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	alerts, err := m.appservices.InsightsServices.DetectAnomalies(ctx)
	if err != nil {
		m.logger.Errorw("failed to detect kpi anomalies", "error", err)
		return
	}
	m.logger.Infow("kpi anomalies detected", "count", len(alerts))
}

// SendScheduledReportsCronjob emails due scheduled reports (HU-ANALYTICS-16).
func (m *Manager) SendScheduledReportsCronjob() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	sent, err := m.appservices.InsightsServices.RunDueSchedules(ctx)
	if err != nil {
		m.logger.Errorw("failed to run scheduled reports", "error", err)
		return
	}
	if sent > 0 {
		m.logger.Infow("scheduled reports sent", "count", sent)
	}
}
