import { mainCurrencies } from '@vitalfit/sdk';

export { mainCurrencies };

export type ClientInvoice = {
    invoice_id: string;
    branch_id: string;
    issue_date: string;
    total_amount: string;
    status: string;
};

export type InvoiceList = {
    client_name: string;
    invoice_id: string;
    invoice_number: string;
    issue_date: string;
    status: string;
    total_amount: number;
};
