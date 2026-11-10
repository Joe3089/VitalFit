CREATE TABLE IF NOT EXISTS client_service_balances (
    user_id UUID NOT NULL,
    service_id UUID NOT NULL,
    
    balance INTEGER NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_client_service_balances PRIMARY KEY (user_id, service_id),

    CONSTRAINT fk_csb_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_csb_service 
        FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,

    CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);
