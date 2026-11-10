import type {
  CreatePackagePayload,
  DataResponse,
  PackageDetail,
  PackageListItem,
  PaginatedTotal,
  PaginationRequest,
  UpdatePackagePayload,
} from '@/types';
import { Client } from '../client';

export class PackagesService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.createPackage = this.createPackage.bind(this);
    this.getPackages = this.getPackages.bind(this);
    this.getPackageByID = this.getPackageByID.bind(this);
    this.updatePackage = this.updatePackage.bind(this);
    this.deletePackage = this.deletePackage.bind(this);
  }

  async createPackage(data: CreatePackagePayload, jwt: string): Promise<void> {
    await this.client.post({
      url: '/packages',
      jwt,
      data,
    });
  }

  async getPackages(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<PackageListItem[]>> {
    const response = await this.client.get({
      url: '/packages',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<PackageListItem[]>;
  }

  async getPackageByID(
    packageId: string,
    jwt: string,
  ): Promise<DataResponse<PackageDetail>> {
    const response = await this.client.get({
      url: `/packages/${packageId}`,
      jwt,
    });
    return response as unknown as DataResponse<PackageDetail>;
  }

  async updatePackage(
    packageId: string,
    data: UpdatePackagePayload,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/packages/${packageId}`,
      jwt,
      data,
    });
  }

  async deletePackage(packageId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/packages/${packageId}`,
      jwt,
    });
  }
}
