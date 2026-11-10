CREATE TABLE fiscal_document_types (
    document_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    prefix VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

INSERT INTO fiscal_document_types (name, prefix)
VALUES
    ('Invoice', 'F-'),
    ('Sales Slip', 'B-'),
    ('Credit Note', 'NC-'),
    ('Debit Note', 'ND-'),
    ('Receipt', 'R-');