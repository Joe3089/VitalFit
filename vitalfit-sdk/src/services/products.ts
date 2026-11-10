import { Client } from '../client';
import type {
  ClientBalance,
  CreateService,
  DataResponse,
  ServiceCategoryInfo,
  ServiceFullDetail,
  UpdateServiceManual,
  CreateBranchServicePriceItem,
  BranchServicePrice,
  UpdateBranchServicePrice,
  PaginatedServiceRequest,
  PaginatedTotal,
  ServicesSummary,
} from '@/types';

export class ProductsService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.createService = this.createService.bind(this);
    this.getServices = this.getServices.bind(this);
    this.getSummary = this.getSummary.bind(this);
    this.getClientBalances = this.getClientBalances.bind(this);
    this.getServiceByID = this.getServiceByID.bind(this);
    this.updateService = this.updateService.bind(this);
    this.deleteService = this.deleteService.bind(this);
    this.getCategories = this.getCategories.bind(this);

    this.addBranchService = this.addBranchService.bind(this);
    this.removeBranchService = this.removeBranchService.bind(this);
    this.getBranchServices = this.getBranchServices.bind(this);
    this.getBranchServiceByID = this.getBranchServiceByID.bind(this);
    this.updateBranchService = this.updateBranchService.bind(this);
  }
  async createService(data: CreateService, jwt: string): Promise<void> {
    await this.client.post({
      url: '/services',
      jwt,
      data,
    });
  }

  async getServices(
    jwt: string,
    {
      page = 10,
      limit = 10,
      sort = 'desc',
      search,
      category,
    }: PaginatedServiceRequest,
  ): Promise<PaginatedTotal<ServiceFullDetail[]>> {
    const response = await this.client.get({
      url: '/services/all',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
        category,
      },
    });
    return response as unknown as PaginatedTotal<ServiceFullDetail[]>;
  }

  async getSummary(jwt: string): Promise<DataResponse<ServicesSummary>> {
    const response = await this.client.get({
      url: '/services/summary',
      jwt,
    });
    return response as unknown as DataResponse<ServicesSummary>;
  }

  async getClientBalances(
    jwt: string,
    userId?: string,
  ): Promise<DataResponse<ClientBalance[]>> {
    const response = await this.client.get({
      url: '/services/balances',
      jwt,
      params: {
        user_id: userId,
      },
    });
    return response as unknown as DataResponse<ClientBalance[]>;
  }

  async getServiceByID(
    serviceId: string,
    jwt: string,
  ): Promise<DataResponse<ServiceFullDetail>> {
    const response = await this.client.get({
      url: `/services/${serviceId}`,
      jwt,
    });
    return response as unknown as DataResponse<ServiceFullDetail>;
  }

  async updateService(
    serviceId: string,
    data: UpdateServiceManual,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/services/${serviceId}`,
      jwt,
      data,
    });
  }
  async deleteService(serviceId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/services/${serviceId}`,
      jwt,
    });
  }
  async getCategories(
    jwt: string,
  ): Promise<DataResponse<ServiceCategoryInfo[]>> {
    const response = await this.client.get({
      url: '/services/categories',
      jwt,
    });
    return response as unknown as DataResponse<ServiceCategoryInfo[]>;
  }

  async addBranchService(
    BranchServiceData: CreateBranchServicePriceItem[],
    branchId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/branches/${branchId}/services`,
      jwt,
      data: {
        services: BranchServiceData,
      },
    });
  }

  async getBranchServices(
    branchId: string,
    jwt: string,
  ): Promise<DataResponse<BranchServicePrice[]>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/services`,
      jwt,
    });
    return response as unknown as DataResponse<BranchServicePrice[]>;
  }

  async getBranchServiceByID(
    branchId: string,
    jwt: string,
    serviceId: string,
  ): Promise<DataResponse<BranchServicePrice>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/services/${serviceId}`,
      jwt,
    });
    return response as unknown as DataResponse<BranchServicePrice>;
  }

  async updateBranchService(
    branchId: string,
    serviceId: string,
    BranchServiceData: UpdateBranchServicePrice,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/branches/${branchId}/services/${serviceId}`,
      jwt,
      data: BranchServiceData,
    });
  }

  async removeBranchService(
    branchId: string,
    serviceId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/branches/${branchId}/services/${serviceId}`,
      jwt,
    });
  }
}
