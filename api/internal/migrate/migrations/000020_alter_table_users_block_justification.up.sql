BEGIN;

ALTER TABLE users
ADD COLUMN status client_status NOT NULL DEFAULT 'Active',
ADD COLUMN block_justification TEXT;

UPDATE users u
SET
    status = cp.status,
    block_justification = cp.block_justification
FROM client_profiles cp
WHERE u.user_id = cp.user_id;

ALTER TABLE client_profiles
DROP COLUMN status,
DROP COLUMN block_justification;

COMMIT;