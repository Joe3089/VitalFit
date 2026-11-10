BEGIN;

ALTER TABLE invoice_items
    DROP COLUMN IF EXISTS total_line,
    DROP COLUMN IF EXISTS subtotal,
    DROP COLUMN IF EXISTS tax_amount,
    DROP COLUMN IF EXISTS tax_rate;

DROP INDEX IF EXISTS idx_invoices_branch_id;

ALTER TABLE invoices
    DROP COLUMN IF EXISTS sub_total,
    DROP COLUMN IF EXISTS branch_id;

COMMIT;