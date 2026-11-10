DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('Completed', 'Failed', 'Refunded', 'Pending');
    END IF;
END$$;
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id),
    payment_date TIMESTAMPTZ NOT NULL,    
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency_paid VARCHAR(3) NOT NULL,
    amount_base DECIMAL(10, 2) NOT NULL,
    currency_base VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(18, 8) NOT NULL,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(method_id),
    transaction_id VARCHAR(255),
    receipt_url VARCHAR(255),
    status payment_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS  idx_payments_status ON payments(status);