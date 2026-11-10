CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY, 
    user_id UUID,             
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    status INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);