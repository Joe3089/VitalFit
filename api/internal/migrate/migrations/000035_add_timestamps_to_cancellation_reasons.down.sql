DROP INDEX IF EXISTS idx_cancellation_reasons_deleted_at;

ALTER TABLE cancellation_reasons
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS created_at;