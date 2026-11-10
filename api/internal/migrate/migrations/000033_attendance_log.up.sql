BEGIN;
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('Attended', 'NoShow', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS attendance_log (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL,    
    service_id UUID,
    schedule_id UUID, 
    
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status attendance_status NOT NULL DEFAULT 'Attended',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_attendance_service 
        FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_attendance_schedule 
        FOREIGN KEY (schedule_id) REFERENCES classes(class_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_log(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_log(check_in_time);

COMMIT;