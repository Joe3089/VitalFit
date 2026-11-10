import { Client } from '../client';

export type DownloadResponse = {
  blob: Blob;
  filename?: string;
};

export class ExportsService {
  private client: Client;
  constructor(client: Client) {
    this.client = client;
    this.exportFinancialReport = this.exportFinancialReport.bind(this);
    this.exportClientsReport = this.exportClientsReport.bind(this);
    this.exportSalesReport = this.exportSalesReport.bind(this);
    this.exportClients = this.exportClients.bind(this);
    this.exportStaff = this.exportStaff.bind(this);
    this.exportInstructors = this.exportInstructors.bind(this);
    this.exportEquipmentTypes = this.exportEquipmentTypes.bind(this);
    this.exportBranchEquipment = this.exportBranchEquipment.bind(this);
    this.exportServices = this.exportServices.bind(this);
    this.exportBranchServices = this.exportBranchServices.bind(this);
    this.exportMembershipPlans = this.exportMembershipPlans.bind(this);
    this.exportPackages = this.exportPackages.bind(this);
    this.exportPaymentMethods = this.exportPaymentMethods.bind(this);
  }

  // Reports
  async exportFinancialReport(
    jwt: string,
    start?: string,
    end?: string,
    branchId?: string,
    format?: 'csv' | 'excel' | 'pdf',
  ): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/reports/export/financial',
      jwt,
      params: {
        start,
        end,
        branch_id: branchId,
        type: format,
      },
    });
  }

  async exportClientsReport(
    jwt: string,
    format?: 'csv' | 'excel' | 'pdf',
  ): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/reports/export/clients',
      jwt,
      params: {
        type: format,
      },
    });
  }

  async exportSalesReport(
    jwt: string,
    start?: string,
    end?: string,
    branchId?: string,
    format?: 'csv' | 'excel' | 'pdf',
  ): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/reports/export/sales',
      jwt,
      params: {
        start,
        end,
        branch_id: branchId,
        type: format,
      },
    });
  }

  // Users & Staff
  async exportClients(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/user/export/clients',
      jwt,
    });
  }

  async exportStaff(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/user/export/users',
      jwt,
    });
  }

  async exportInstructors(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/instructor/export',
      jwt,
    });
  }

  // Inventory & Equipment
  async exportEquipmentTypes(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/equipment-types/export',
      jwt,
    });
  }

  async exportBranchEquipment(
    branchId: string,
    jwt: string,
  ): Promise<DownloadResponse> {
    return await this.client.download({
      url: `/branches/${branchId}/equipment/export`,
      jwt,
    });
  }

  // Services & Products
  async exportServices(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/services/export',
      jwt,
    });
  }

  async exportBranchServices(
    branchId: string,
    jwt: string,
  ): Promise<DownloadResponse> {
    return await this.client.download({
      url: `/branches/${branchId}/services/export`,
      jwt,
    });
  }

  // Memberships & Packages
  async exportMembershipPlans(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/membership-plans/export',
      jwt,
    });
  }

  async exportPackages(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/packages/export',
      jwt,
    });
  }

  // Billing
  async exportPaymentMethods(jwt: string): Promise<DownloadResponse> {
    return await this.client.download({
      url: '/billing/payment-methods/export',
      jwt,
    });
  }
}
