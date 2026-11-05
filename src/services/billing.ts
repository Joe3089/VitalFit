import type {
  AddPaymentToInvoicePayload,
  AddPaymentToInvoiceResponse,
  CheckoutResponse,
  ClientInvoice,
  CreateCheckoutPayload,
  CreateFiscalDocumentRequest,
  CreateInvoicePayload,
  CreateInvoiceResponse,
  DataResponse,
  ExchangeRateResponse,
  FiscalDocument,
  InvoiceAdjustment,
  InvoiceAdjustmentRequest,
  InvoiceDetail,
  InvoiceList,
  PaginatedTotal,
  PaginationRequest,
  PaginationWithStatus,
  PaymentDetail,
  TaxRate,
} from '@/types';
import { Client } from '../client';

export class BillingService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.createInvoice = this.createInvoice.bind(this);
    this.AddPaymentToInvoice = this.AddPaymentToInvoice.bind(this);
    this.getInvoiceByID = this.getInvoiceByID.bind(this);
    this.getPaymentByID = this.getPaymentByID.bind(this);
    this.updatePaymentStatus = this.updatePaymentStatus.bind(this);
    this.getClientInvoices = this.getClientInvoices.bind(this);
    this.getInvoices = this.getInvoices.bind(this);
    this.getTaxRateByBranch = this.getTaxRateByBranch.bind(this);
    this.getExchangeRate = this.getExchangeRate.bind(this);
    this.getFiscalDocuments = this.getFiscalDocuments.bind(this);
    this.createFiscalDocument = this.createFiscalDocument.bind(this);
    this.getFiscalDocumentById = this.getFiscalDocumentById.bind(this);
    this.updateFiscalDocument = this.updateFiscalDocument.bind(this);
    this.deleteFiscalDocument = this.deleteFiscalDocument.bind(this);
    this.createCheckoutSession = this.createCheckoutSession.bind(this);
    this.applyInvoiceAdjustment = this.applyInvoiceAdjustment.bind(this);
    this.getInvoiceAdjustments = this.getInvoiceAdjustments.bind(this);
  }
  async getTaxRateByBranch(jwt: string, branchId: string): Promise<TaxRate> {
    const response = await this.client.get({
      url: `/billing/tax-rate/${branchId}`,
      jwt,
    });
    return response as unknown as TaxRate;
  }

  async getExchangeRate(
    jwt: string,
    currency: string,
  ): Promise<ExchangeRateResponse> {
    const response = await this.client.get({
      url: `/billing/rates/${currency}`,
      jwt,
    });

    return response as unknown as ExchangeRateResponse;
  }

  async createInvoice(
    data: CreateInvoicePayload,
    jwt: string,
  ): Promise<CreateInvoiceResponse> {
    const response = await this.client.post({
      url: '/billing/invoices',
      jwt,
      data,
    });
    return response as unknown as CreateInvoiceResponse;
  }
  async getInvoiceByID(
    invoiceId: string,
    jwt: string,
  ): Promise<DataResponse<InvoiceDetail>> {
    const response = await this.client.get({
      url: `/billing/invoices/${invoiceId}`,
      jwt,
    });
    return response as unknown as DataResponse<InvoiceDetail>;
  }

  async AddPaymentToInvoice(
    data: AddPaymentToInvoicePayload,
    jwt: string,
  ): Promise<AddPaymentToInvoiceResponse> {
    const response = await this.client.post({
      url: '/billing/invoices/payment',
      jwt,
      data,
    });
    return response as unknown as AddPaymentToInvoiceResponse;
  }

  async getPaymentByID(
    paymentId: string,
    jwt: string,
  ): Promise<DataResponse<PaymentDetail>> {
    const response = await this.client.get({
      url: `/billing/payments/${paymentId}`,
      jwt,
    });
    return response as unknown as DataResponse<PaymentDetail>;
  }
  async updatePaymentStatus(
    paymentId: string,
    status: string,
    jwt: string,
  ): Promise<void> {
    await this.client.patch({
      url: `/billing/payments/${paymentId}/status`,
      jwt,
      data: {
        status: status,
      },
    });
  }
  async getClientInvoices(
    jwt: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest,
    userID?: string,
  ): Promise<PaginatedTotal<ClientInvoice[]>> {
    const response = await this.client.get({
      url: `/billing/invoices/client/${userID}`,
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<ClientInvoice[]>;
  }
  async getInvoices(
    jwt: string,
    {
      page = 1,
      limit = 10,
      sort = 'desc',
      search,
      status,
    }: PaginationWithStatus,
    branchID?: string,
  ): Promise<PaginatedTotal<InvoiceList[]>> {
    const response = await this.client.get({
      url: '/billing/invoices',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
        status,
        branch_id: branchID,
      },
    });
    return response as unknown as PaginatedTotal<InvoiceList[]>;
  }
  async getFiscalDocuments(
    jwt: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<FiscalDocument[]>> {
    const response = await this.client.get({
      url: '/billing/fiscal-document-types',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<FiscalDocument[]>;
  }
  async createFiscalDocument(
    jwt: string,
    data: CreateFiscalDocumentRequest,
  ): Promise<void> {
    await this.client.post({
      url: '/billing/fiscal-document-types',
      jwt,
      data,
    });
  }
  async getFiscalDocumentById(
    jwt: string,
    id: string,
  ): Promise<DataResponse<FiscalDocument>> {
    const response = await this.client.get({
      url: `/billing/fiscal-document-types/${id}`,
      jwt,
    });
    return response as unknown as DataResponse<FiscalDocument>;
  }

  async updateFiscalDocument(
    jwt: string,
    id: string,
    data: CreateFiscalDocumentRequest,
  ): Promise<void> {
    await this.client.put({
      url: `/billing/fiscal-document-types/${id}`,
      jwt,
      data,
    });
  }
  async deleteFiscalDocument(jwt: string, id: string): Promise<void> {
    await this.client.delete({
      url: `/billing/fiscal-document-types/${id}`,
      jwt,
    });
  }

  async createCheckoutSession(
    data: CreateCheckoutPayload,
    jwt: string,
  ): Promise<CheckoutResponse> {
    const response = await this.client.post({
      url: '/billing/checkout',
      jwt,
      data,
    });
    return response as unknown as CheckoutResponse;
  }

  /** Post-sale discount with full traceability (capped by GLOBAL_MAX_DISCOUNT). */
  async applyInvoiceAdjustment(
    jwt: string,
    invoiceId: string,
    data: InvoiceAdjustmentRequest,
  ): Promise<InvoiceAdjustment> {
    return this.client.post({
      url: `/billing/invoices/${invoiceId}/adjustments`,
      jwt,
      data: { ...data, discount_value: String(data.discount_value) },
    });
  }

  async getInvoiceAdjustments(
    jwt: string,
    invoiceId: string,
  ): Promise<DataResponse<InvoiceAdjustment[]>> {
    return this.client.get({
      url: `/billing/invoices/${invoiceId}/adjustments`,
      jwt,
    });
  }
}
