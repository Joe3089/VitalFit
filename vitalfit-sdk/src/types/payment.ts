export type CreateInvoiceItem = {
  item_id: string;
  item_type: 'membership' | 'service' | 'package' | string;
  quantity: number;
};

export type CreateInvoicePayload = {
  branch_id: string;
  items: CreateInvoiceItem[];
  user_id: string | null;
};

export type CreateInvoiceResponse = {
  invoice_id: string;
  message: string;
};

export type AddPaymentToInvoicePayload = {
  amount_paid: number;
  currency_paid: string;
  invoice_id: string;
  payment_method_id: string;
  receipt_url: string;
  transaction_id: string;
};

export type AddPaymentToInvoiceResponse = {
  message: string;
  payment_id: string;
};
// invoice
export type InvoiceItemDetail = {
  invoice_item_id: string;
  quantity: number;
  unit_price: string;
  discount_applied: string;
  tax_rate: string;
  tax_amount: string;
  subtotal: string;
  total_line: string;
  membership_type_id?: string;
  service_id?: string;
  package_id?: string;
};

export type InvoicePaymentDetail = {
  payment_id: string;
  payment_date: string;
  amount_paid: string;
  currency_paid: string;
  amount_base: string;
  exchange_rate: string;
  payment_method_id: string;
  transaction_id: string;
  status: string;
  receipt_url: string;
};

export type InvoiceDetail = {
  invoice_id: string;
  user_id: string;
  branch_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  sub_total: string;
  tax: string;
  total_amount: string;
  status: string;
  created_at: string;
  invoice_items: InvoiceItemDetail[];
  payments: InvoicePaymentDetail[];
};

export type PaymentDetail = {
  payment_id: string;
  payment_date: string;
  amount_paid: string;
  currency_paid: string;
  amount_base: string;
  exchange_rate: string;
  payment_method_id: string;
  transaction_id: string;
  status: string;
  receipt_url: string;
};
