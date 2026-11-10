DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'muscle_group_enum') THEN
        CREATE TYPE muscle_group_enum AS ENUM ('Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'FullBody', 'Other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routine_level_enum') THEN
        CREATE TYPE routine_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routine_status_enum') THEN
        CREATE TYPE routine_status_enum AS ENUM ('Active', 'Completed', 'Archived');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS exercises (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    video_url VARCHAR(255),
    muscle_group muscle_group_enum,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS routines (
    routine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level routine_level_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_routines_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS routine_exercises (
    routine_exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL,
    exercise_id UUID NOT NULL,
    
    sets INT NOT NULL,
    reps VARCHAR(20) NOT NULL,
    rest_time INT DEFAULT 60,
    "order" INT NOT NULL,
    notes TEXT,

    CONSTRAINT fk_re_routine FOREIGN KEY (routine_id) REFERENCES routines(routine_id) ON DELETE CASCADE,
    CONSTRAINT fk_re_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_routines (
    user_routine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    instructor_id UUID NOT NULL,
    routine_id UUID NOT NULL,
    
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status routine_status_enum DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_ur_client FOREIGN KEY (client_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_instructor FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_ur_routine FOREIGN KEY (routine_id) REFERENCES routines(routine_id) ON DELETE CASCADE
);

CREATE INDEX idx_routines_service ON routines(service_id);
CREATE INDEX idx_user_routines_client ON user_routines(client_id);
CREATE INDEX idx_user_routines_status ON user_routines(status);