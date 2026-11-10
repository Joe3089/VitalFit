ALTER TABLE routines ADD COLUMN IF NOT EXISTS creator_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_routines_creator') THEN
        ALTER TABLE routines
        ADD CONSTRAINT fk_routines_creator
        FOREIGN KEY (creator_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_routines_creator ON routines(creator_id);