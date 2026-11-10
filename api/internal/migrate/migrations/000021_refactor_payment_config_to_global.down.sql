ALTER TABLE payment_methods_branch
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS visibility branch_payment_visibility_enum NOT NULL DEFAULT 'All',
ADD COLUMN IF NOT EXISTS surcharge_fixed BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_percentage DECIMAL(4, 2) NOT NULL DEFAULT 0;


ALTER TABLE payment_methods
DROP COLUMN IF EXISTS display_name,
DROP COLUMN IF EXISTS configuration,
DROP COLUMN IF EXISTS visibility,
DROP COLUMN IF EXISTS surcharge_fixed,
DROP COLUMN IF EXISTS surcharge_percentage;