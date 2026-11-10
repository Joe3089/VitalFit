DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE invoice_status AS ENUM ('Paid', 'Unpaid', 'Void', 'Overdue');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    document_type_id UUID NOT NULL REFERENCES fiscal_document_types(document_type_id),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2), 
    status invoice_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);