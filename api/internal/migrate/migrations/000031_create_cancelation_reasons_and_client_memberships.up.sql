BEGIN;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('Active', 'Expired', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS cancellation_reasons (
    reason_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cancellation_reasons (description) VALUES 
    ('Client moved'),
    ('Dissatisfied with service'),
    ('Medical reasons'),
    ('Financial reasons'),
    ('Switching to competitor'),
    ('Other');

CREATE TABLE IF NOT EXISTS client_memberships (
    client_membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    membership_type_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status membership_status NOT NULL,
    invoice_id UUID NOT NULL,
    cancellation_reason_id UUID,
    cancellation_notes TEXT,

    CONSTRAINT fk_client_memberships_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_client_memberships_type 
        FOREIGN KEY (membership_type_id) REFERENCES membership_types(membership_type_id) ON DELETE RESTRICT,
    
    CONSTRAINT fk_client_memberships_invoice 
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
    
    CONSTRAINT fk_client_memberships_reason 
        FOREIGN KEY (cancellation_reason_id) REFERENCES cancellation_reasons(reason_id) ON DELETE SET NULL
);


COMMIT;