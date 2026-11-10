BEGIN;

DELETE FROM permissions WHERE name IN (
    'crm:feedback_manage', 'crm:tags_manage', 'crm:contact_view', 'insights:view',
    'insights:manage', 'security:manage', 'billing:adjust', 'schedule:cancel'
);

DROP TABLE IF EXISTS kpi_alerts;
DROP TABLE IF EXISTS bi_api_keys;
DROP TABLE IF EXISTS report_share_links;
DROP TABLE IF EXISTS report_schedules;
DROP TABLE IF EXISTS report_templates;

ALTER TABLE classes
    DROP COLUMN IF EXISTS cancelled_by,
    DROP COLUMN IF EXISTS cancelled_at,
    DROP COLUMN IF EXISTS cancellation_reason,
    DROP COLUMN IF EXISTS status;

DROP TABLE IF EXISTS invoice_adjustments;
DROP TABLE IF EXISTS two_factor_challenges;
DROP TRIGGER IF EXISTS trg_users_password_changed_at ON users;
DROP FUNCTION IF EXISTS set_password_changed_at();
ALTER TABLE users DROP COLUMN IF EXISTS password_changed_at;
DROP TABLE IF EXISTS security_settings;
DROP TABLE IF EXISTS web_events;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS nps_responses;
DROP TABLE IF EXISTS client_tag_assignments;
DROP TABLE IF EXISTS client_tags;
DROP TABLE IF EXISTS client_feedback;

COMMIT;
