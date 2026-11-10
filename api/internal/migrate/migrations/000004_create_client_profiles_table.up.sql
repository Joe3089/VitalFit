CREATE TABLE IF NOT EXISTS client_profiles (
    user_id UUID PRIMARY KEY, -- Primary Key
    qr_code TEXT,
    scoring INT NOT NULL DEFAULT 0,
    status client_status NOT NULL DEFAULT 'Active',
    block_justification TEXT,
    category client_category NOT NULL DEFAULT 'New',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    

    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);