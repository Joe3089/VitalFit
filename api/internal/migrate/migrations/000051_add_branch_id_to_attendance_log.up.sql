ALTER TABLE attendance_log
ADD COLUMN branch_id UUID REFERENCES branch(branch_id) ON DELETE CASCADE;

CREATE INDEX idx_attendance_branch ON attendance_log(branch_id);

UPDATE attendance_log
SET branch_id = (
    SELECT sbd.branch_id
    FROM service_branch_details sbd
    WHERE sbd.service_id = attendance_log.service_id
    LIMIT 1
)
WHERE service_id IN (SELECT service_id FROM services WHERE name = 'Open Gym');

UPDATE attendance_log
SET branch_id = c.branch_id
FROM classes c
WHERE attendance_log.schedule_id = c.class_id
  AND attendance_log.branch_id IS NULL;