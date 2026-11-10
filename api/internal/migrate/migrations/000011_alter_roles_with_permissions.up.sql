BEGIN;

CREATE TABLE IF NOT EXISTS permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, 
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    CONSTRAINT fk_role
        FOREIGN KEY(role_id) 
        REFERENCES roles(role_id)
        ON DELETE CASCADE, 
    
    
    CONSTRAINT fk_permission
        FOREIGN KEY(permission_id) 
        REFERENCES permissions(permission_id)
        ON DELETE CASCADE, 

    PRIMARY KEY (role_id, permission_id)
);


ALTER TABLE roles
DROP COLUMN IF EXISTS level;

COMMIT;