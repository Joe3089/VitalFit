DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_payment_visibility_enum') THEN
        CREATE TYPE branch_payment_visibility_enum AS ENUM (
            'Client',
            'Staff',
            'All'
        );
    END IF;
END$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_processing_type_enum') THEN
        CREATE TYPE payment_processing_type_enum AS ENUM (
            'Gateway',
            'Offline'
        );
    END IF;
END$$;


ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS processing_type payment_processing_type_enum NOT NULL DEFAULT 'Offline',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

UPDATE payment_methods
SET processing_type = CASE
    WHEN name = 'Debit Card' THEN 'Gateway'::payment_processing_type_enum
    WHEN name = 'Credit Card' THEN 'Gateway'::payment_processing_type_enum
    ELSE 'Offline'::payment_processing_type_enum
END
WHERE processing_type = 'Offline'; 


INSERT INTO payment_methods (name, type, processing_type, description)
VALUES 
    (
        'Zelle', 
        'Transfer', 
        'Offline', 
        'Pago por Zelle (requiere validación manual)'
    ),
    (
        'Pago Movil', 
        'Transfer', 
        'Offline', 
        'Pago Móvil interbancario (requiere validación manual)'
    )
ON CONFLICT (name) DO NOTHING; 


ALTER TABLE payment_methods_branch
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS visibility branch_payment_visibility_enum NOT NULL DEFAULT 'All',
ADD COLUMN IF NOT EXISTS surcharge_fixed BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_percentage DECIMAL(4, 2) NOT NULL DEFAULT 0;