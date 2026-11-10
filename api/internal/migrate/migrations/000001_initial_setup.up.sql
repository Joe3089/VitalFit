
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE client_status AS ENUM ('Active', 'Blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_category') THEN
        CREATE TYPE client_category AS ENUM ('VIP', 'Regular', 'New', 'AtRisk');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM (
            'male', 
            'female',
            'prefer-not-to-say'
        );
    END IF;
END$$;