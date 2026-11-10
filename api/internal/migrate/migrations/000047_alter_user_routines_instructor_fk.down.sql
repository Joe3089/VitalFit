-- Drop the foreign key constraint pointing to instructors
ALTER TABLE user_routines DROP CONSTRAINT IF EXISTS fk_ur_instructor;

-- Revert data: assuming current values are instructor_ids, update them back to user_ids
UPDATE user_routines ur
SET instructor_id = i.user_id
FROM instructors i
WHERE ur.instructor_id = i.instructor_id;

-- Clean up any records that don't map back to a valid user (safety check)
DELETE FROM user_routines
WHERE instructor_id NOT IN (SELECT user_id FROM users);

-- Add the old foreign key constraint pointing to users
ALTER TABLE user_routines
    ADD CONSTRAINT fk_ur_instructor
    FOREIGN KEY (instructor_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL;