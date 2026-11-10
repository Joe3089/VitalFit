-- 000012_create_equipment_table.up.sql

-- Create ENUM type for equipment category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_category') THEN
        CREATE TYPE equipment_category AS ENUM ('Cardio', 'Strength', 'FreeWeight', 'Functional', 'Accessory');
    END IF;
END
$$;

-- Create table
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category equipment_category NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT equipment_unique_name_brand_model UNIQUE (name, brand, model)
);
