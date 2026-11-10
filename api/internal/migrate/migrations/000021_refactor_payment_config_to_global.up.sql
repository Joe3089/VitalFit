ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS visibility branch_payment_visibility_enum NOT NULL DEFAULT 'All',
ADD COLUMN IF NOT EXISTS surcharge_fixed BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_percentage DECIMAL(4, 2) NOT NULL DEFAULT 0;

WITH branch_config AS (
    SELECT DISTINCT ON (method_id)
        method_id,
        display_name,
        configuration,
        visibility,
        surcharge_fixed,
        surcharge_percentage
    FROM 
        payment_methods_branch
    ORDER BY 
        method_id, created_at
)
UPDATE payment_methods pm
SET
    display_name = COALESCE(bc.display_name, pm.display_name),
    configuration = COALESCE(bc.configuration, pm.configuration),
    visibility = COALESCE(bc.visibility, pm.visibility),
    surcharge_fixed = COALESCE(bc.surcharge_fixed, pm.surcharge_fixed),
    surcharge_percentage = COALESCE(bc.surcharge_percentage, pm.surcharge_percentage),
    updated_at = NOW()
FROM
    branch_config bc
WHERE
    pm.method_id = bc.method_id;


ALTER TABLE payment_methods_branch
DROP COLUMN IF EXISTS display_name,
DROP COLUMN IF EXISTS configuration,
DROP COLUMN IF EXISTS visibility,
DROP COLUMN IF EXISTS surcharge_fixed,
DROP COLUMN IF EXISTS surcharge_percentage;