-- Drop the existing foreign key constraint pointing to users
ALTER TABLE user_routines DROP CONSTRAINT IF EXISTS fk_ur_instructor;

-- Attempt to migrate existing data: assuming current values are user_ids, update them to instructor_ids
-- This ensures the data is valid for the new foreign key
UPDATE user_routines ur
SET instructor_id = i.instructor_id
FROM instructors i
WHERE ur.instructor_id = i.user_id;

-- Delete rows that couldn't be mapped (referencing users who are not instructors)
-- This prevents the FK creation from failing due to invalid references
DELETE FROM user_routines
WHERE instructor_id NOT IN (SELECT instructor_id FROM instructors);

-- Add the new foreign key constraint pointing to instructors
ALTER TABLE user_routines
    ADD CONSTRAINT fk_ur_instructor
    FOREIGN KEY (instructor_id)
    REFERENCES instructors(instructor_id)
    ON DELETE SET NULL;