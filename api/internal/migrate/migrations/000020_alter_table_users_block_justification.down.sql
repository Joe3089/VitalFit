BEGIN;

ALTER TABLE client_profiles
ADD COLUMN status client_status NOT NULL DEFAULT 'Active',
ADD COLUMN block_justification TEXT;

UPDATE client_profiles cp
SET
    status = u.status,
    block_justification = u.block_justification
FROM users u
WHERE cp.user_id = u.user_id;

ALTER TABLE users
DROP COLUMN status,
DROP COLUMN block_justification;

COMMIT;