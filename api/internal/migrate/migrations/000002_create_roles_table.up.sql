CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    level SMALLINT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, level, description) VALUES
('super_admin', 99, 'System-wide ultimate administrator with full privileges.'),
('branch_admin', 50, 'Administrator with management privileges restricted to a specific branch or location.'),
('accountant', 30, 'Manages financial records, billing, and general accounting tasks.'),
('data_analyst', 20, 'Analyzes data, generates reports, and provides insights.'),
('instructor', 10, 'Responsible for teaching, training, and managing educational content.'),
('recepcionist', 5, 'Handles front-desk operations, scheduling, and customer check-in.'),
('client', 1, 'Standard user or customer account with limited access to personal data and services.');