CREATE TABLE IF NOT EXISTS commercial_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    
    value TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    
    min_limit DECIMAL(10, 2) DEFAULT NULL,
    max_limit DECIMAL(10, 2) DEFAULT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commercial_policies_key ON commercial_policies(policy_key);