ALTER TABLE cancellation_reasons
ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP;

-- Update existing records to have created_at set to current time
UPDATE cancellation_reasons
SET created_at = NOW()
WHERE created_at IS NULL;

-- Create index on deleted_at for soft delete queries
CREATE INDEX idx_cancellation_reasons_deleted_at ON cancellation_reasons(deleted_at);