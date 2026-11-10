DROP INDEX IF EXISTS idx_attendance_branch;

ALTER TABLE attendance_log
DROP COLUMN IF EXISTS branch_id;