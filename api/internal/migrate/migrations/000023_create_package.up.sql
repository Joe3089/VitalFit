CREATE TABLE IF NOT EXISTS packages (
    package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS package_items (
    package_id UUID NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    sessions_included INT NOT NULL DEFAULT 10,
    
    PRIMARY KEY (package_id, service_id)
);