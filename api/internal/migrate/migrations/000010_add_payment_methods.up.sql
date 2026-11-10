DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type_enum') THEN
        CREATE TYPE payment_method_type_enum AS ENUM (
            'Cash',
            'Card',
            'Transfer',
            'Other'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS payment_methods (
    method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type payment_method_type_enum NOT NULL,
    description TEXT,
    global_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO payment_methods (name, type, description)
VALUES 
('Cash', 'Cash', 'Payment in cash'),
('Debit Card', 'Card', 'Payment with debit card'),
('Credit Card', 'Card', 'Payment with credit card'),
('Bank Transfer', 'Transfer', 'Payment by bank transfer (e.g., Zelle, Mobile Payment)'),
('Point of Sale', 'Card', 'Payment at POS terminal (cards)'),
('Other', 'Other', 'Other unlisted payment method');

CREATE TABLE IF NOT EXISTS payment_methods_branch (
    branch_id UUID NOT NULL,
    method_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
 
    CONSTRAINT fk_pmb_branch
        FOREIGN KEY(branch_id) 
        REFERENCES branch(branch_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_pmb_method
        FOREIGN KEY(method_id) 
        REFERENCES payment_methods(method_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_pmb_branch_method
        UNIQUE (branch_id, method_id)
);