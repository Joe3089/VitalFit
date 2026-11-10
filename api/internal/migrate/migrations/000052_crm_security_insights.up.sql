BEGIN;

-- HU-CLI-08: quejas y sugerencias
CREATE TABLE IF NOT EXISTS client_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branch(branch_id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('complaint', 'suggestion', 'compliment')),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolution_notes TEXT,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_client_feedback_user ON client_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_status ON client_feedback(status);

-- HU-CLI-13: tags personalizables
CREATE TABLE IF NOT EXISTS client_tags (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(60) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#f58a24',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS client_tag_assignments (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES client_tags(tag_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tag_id)
);

-- HU-ANALYTICS-06: NPS
CREATE TABLE IF NOT EXISTS nps_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branch(branch_id) ON DELETE SET NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
    comment TEXT,
    channel VARCHAR(20) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nps_created ON nps_responses(created_at);

-- HU-ECOMMERCE-23: formulario de contacto
CREATE TABLE IF NOT EXISTS contact_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    branch_id UUID REFERENCES branch(branch_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'answered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HU-ANALYTICS-03: eventos web para tasa de conversion
CREATE TABLE IF NOT EXISTS web_events (
    event_id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('visit', 'signup', 'checkout', 'purchase')),
    path VARCHAR(255),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_web_events_created ON web_events(created_at, event_type);

-- HU-ADMIN-07 / HU-ADMIN-03: politicas de seguridad y 2FA
CREATE TABLE IF NOT EXISTS security_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    min_length SMALLINT NOT NULL DEFAULT 8 CHECK (min_length BETWEEN 6 AND 72),
    require_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
    require_lowercase BOOLEAN NOT NULL DEFAULT TRUE,
    require_number BOOLEAN NOT NULL DEFAULT TRUE,
    require_special BOOLEAN NOT NULL DEFAULT TRUE,
    expiration_days INT NOT NULL DEFAULT 90 CHECK (expiration_days >= 0),
    two_factor_required BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO security_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION set_password_changed_at() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
        NEW.password_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_password_changed_at ON users;
CREATE TRIGGER trg_users_password_changed_at
    BEFORE UPDATE OF password_hash ON users
    FOR EACH ROW EXECUTE FUNCTION set_password_changed_at();

CREATE TABLE IF NOT EXISTS two_factor_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    code_hash BYTEA NOT NULL,
    device_token TEXT,
    attempts SMALLINT NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_2fa_user ON two_factor_challenges(user_id);

-- HU-MEM-04: descuentos post-venta con trazabilidad
CREATE TABLE IF NOT EXISTS invoice_adjustments (
    adjustment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('Percentage', 'FixedAmount')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    amount DECIMAL(10, 2) NOT NULL,
    previous_total DECIMAL(10, 2) NOT NULL,
    new_total DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    applied_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoice_adjustments_invoice ON invoice_adjustments(invoice_id);

-- HU-CLA-03: cancelacion de clases con motivo
ALTER TABLE classes
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(user_id) ON DELETE SET NULL;

-- HU-ANALYTICS-22: plantillas de reportes
CREATE TABLE IF NOT EXISTS report_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    primary_color VARCHAR(20) NOT NULL DEFAULT '#f58a24',
    header_text VARCHAR(255) NOT NULL DEFAULT 'VitalFit',
    footer_text VARCHAR(255) NOT NULL DEFAULT '',
    orientation VARCHAR(1) NOT NULL DEFAULT 'L' CHECK (orientation IN ('L', 'P')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO report_templates (name, is_default) VALUES ('Corporativa VitalFit', TRUE) ON CONFLICT DO NOTHING;

-- HU-ANALYTICS-16: envio programado de reportes
CREATE TABLE IF NOT EXISTS report_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('financial', 'sales', 'clients', 'benchmark')),
    format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf')),
    frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    recipients TEXT[] NOT NULL,
    branch_id UUID REFERENCES branch(branch_id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(template_id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HU-ANALYTICS-18: URL temporal para compartir reportes
CREATE TABLE IF NOT EXISTS report_share_links (
    token_hash VARCHAR(64) PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL,
    format VARCHAR(10) NOT NULL,
    branch_id UUID REFERENCES branch(branch_id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(template_id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    access_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HU-ANALYTICS-17: API keys para herramientas BI
CREATE TABLE IF NOT EXISTS bi_api_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HU-ANALYTICS-19: alertas de anomalias en KPIs
CREATE TABLE IF NOT EXISTS kpi_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branch(branch_id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    message TEXT NOT NULL,
    observed_value DOUBLE PRECISION NOT NULL,
    expected_value DOUBLE PRECISION NOT NULL,
    z_score DOUBLE PRECISION NOT NULL,
    alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_alert_day ON kpi_alerts(COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), metric, alert_date);

-- Permisos nuevos
INSERT INTO permissions (name, description) VALUES
    ('crm:feedback_manage', 'Allows registering and managing client complaints and suggestions'),
    ('crm:tags_manage', 'Allows creating client tags and assigning them to clients'),
    ('crm:contact_view', 'Allows reading messages sent from the public contact form'),
    ('insights:view', 'Allows viewing advanced analytics (conversion, NPS, RevPAS, benchmarking, churn, alerts)'),
    ('insights:manage', 'Allows managing scheduled reports, shared links, templates and BI API keys'),
    ('security:manage', 'Allows configuring password policies and two-factor authentication'),
    ('billing:adjust', 'Allows applying post-sale discounts to invoices'),
    ('schedule:cancel', 'Allows cancelling a scheduled class with a reason')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON (
    (r.name = 'branch_admin' AND p.name IN ('crm:feedback_manage', 'crm:tags_manage', 'crm:contact_view', 'insights:view', 'billing:adjust', 'schedule:cancel'))
 OR (r.name = 'recepcionist' AND p.name IN ('crm:feedback_manage', 'crm:contact_view'))
 OR (r.name = 'data_analyst' AND p.name IN ('insights:view'))
 OR (r.name = 'accountant' AND p.name IN ('insights:view', 'billing:adjust'))
)
ON CONFLICT DO NOTHING;

COMMIT;
