CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    phone VARCHAR(50),
    identity_document VARCHAR(50) UNIQUE,
    password_hash BYTEA,
    birth_date DATE,
    gender gender_enum,
    profile_picture_url VARCHAR(255),
    
    role_id UUID NOT NULL REFERENCES roles(role_id),
    
    is_validated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);
