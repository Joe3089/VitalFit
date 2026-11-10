CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL,
    refresh_token TEXT,
    user_agent TEXT,
    client_ip VARCHAR(45),
    
    is_blocked BOOLEAN DEFAULT FALSE,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_sessions_user
        FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);