CREATE TABLE IF NOT EXISTS password_reset_token(
    token bytea PRIMARY KEY,
    user_id UUID NOT NULL,
    expiry timestamp(0) WITH TIME ZONE NOT NULL
)
