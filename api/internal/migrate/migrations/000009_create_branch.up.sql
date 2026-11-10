DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_status_enum') THEN
        CREATE TYPE branch_status_enum AS ENUM (
          'Active',
          'Inactive',
          'Maintenance'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week_enum') THEN
        CREATE TYPE day_of_week_enum AS ENUM (
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS branch (
  branch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  tax_id varchar(20) NOT NULL UNIQUE,
  address text,
  state_id uuid NOT NULL REFERENCES states (state_id),
  latitude double precision,
  longitude double precision,
  max_capacity int,
  phone varchar(30),
  status branch_status_enum NOT NULL DEFAULT 'Active',
  user_id uuid NOT NULL REFERENCES users (user_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operating_hours (
  hour_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branch (branch_id) ON DELETE CASCADE,
  day_of_week day_of_week_enum NOT NULL,
  open_time time,
  close_time time,
  is_closed BOOLEAN DEFAULT FALSE,
  
  UNIQUE (branch_id, day_of_week)
);
