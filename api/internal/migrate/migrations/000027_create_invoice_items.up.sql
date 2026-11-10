CREATE TABLE IF NOT EXISTS invoice_items (
    invoice_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL, 
  --  promotion_id UUID REFERENCES promotions(promotion_id),
    discount_applied DECIMAL(10, 2) DEFAULT 0, 
    membership_type_id UUID REFERENCES membership_types(membership_type_id),
    service_id UUID REFERENCES services(service_id),
    package_id UUID REFERENCES packages(package_id),
    
    CONSTRAINT chk_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);