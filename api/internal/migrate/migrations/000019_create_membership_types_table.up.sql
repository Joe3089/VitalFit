-- ----------------------------------------------------
-- 000019_create_membership_types_table.up.sql
-- Module: Memberships
-- Description: Creates the membership_types table used for plan management.
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS membership_types (
    membership_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    duration_days INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
