ALTER TABLE payment_methods_branch
DROP COLUMN IF EXISTS display_name,
DROP COLUMN IF EXISTS configuration,
DROP COLUMN IF EXISTS visibility,
DROP COLUMN IF EXISTS surcharge_fixed,
DROP COLUMN IF EXISTS surcharge_percentage;

ALTER TABLE payment_methods
DROP COLUMN IF EXISTS processing_type,
DROP COLUMN IF EXISTS deleted_at;

DROP TYPE IF EXISTS branch_payment_visibility_enum;
DROP TYPE IF EXISTS payment_processing_type_enum;