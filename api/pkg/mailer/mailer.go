package mailer

import "embed"

const (
	FromName                = "GopherSocial"
	maxRetries              = 3
	UserWelcomeTemplate     = "user_invitation.tmpl"
	UserResetPwsTemplate    = "user_reset.tmpl"
	UserStaffActivate       = "user_staff_activate.tmpl"
	InvoiceCreationTemplate = "invoice.tmpl"
	InvoicePaidTemplate     = "paid_invoice.tmpl"
	MembershipExpiring      = "membership_expiring.tmpl"
	TwoFactorCodeTemplate   = "two_factor_code.tmpl"
	ScheduledReportTemplate = "scheduled_report.tmpl"
)

//go:embed "templates"
var FS embed.FS

type Client interface {
	Send(templateFile string, username, email string, data any, isSandbox bool) (int, error)
}
