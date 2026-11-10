-- 000013_create_branch_inventory_table.up.sql

-- Create ENUM type for inventory status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_status') THEN
        CREATE TYPE inventory_status AS ENUM ('Available', 'InMaintenance', 'OutOfService');
    END IF;
END
$$;

-- Create table
CREATE TABLE IF NOT EXISTS branch_inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branch(branch_id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    serial_number VARCHAR(255) UNIQUE,
    status inventory_status NOT NULL DEFAULT 'Available',
    acquisition_date DATE,
    last_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
