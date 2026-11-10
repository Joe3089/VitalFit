import { Client } from '../client';
import type {
  DataResponse,
  BranchInfo,
  ServicePublicItem,
  PublicPaginationService,
  PaginatedTotal,
  PublicPaginatedPackage,
  PackagePublicItem,
} from '@/types';

export class PublicService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getBranchMap = this.getBranchMap.bind(this);
    this.getServices = this.getServices.bind(this);
    this.getPackages = this.getPackages.bind(this);
    this.getBranchServices = this.getBranchServices.bind(this);
  }

  async getBranchMap(jwt: string): Promise<DataResponse<BranchInfo[]>> {
    const response = await this.client.get({
      url: '/public/branches-map',
      jwt,
    });

    return response as unknown as DataResponse<BranchInfo[]>;
  }
  async getServices({
    page = 1,
    limit = 10,
    currency,
    category,
    price,
    sortby,
    search,
    sort = 'desc',
  }: PublicPaginationService): Promise<PaginatedTotal<ServicePublicItem[]>> {
    const response = await this.client.get({
      url: '/public/services',
      params: {
        page,
        limit,
        currency,
        category,
        price,
        sortby,
        search,
        sort,
      },
    });
    return response as unknown as PaginatedTotal<ServicePublicItem[]>;
  }

  async getPackages({
    page = 1,
    limit = 10,
    currency,
  }: PublicPaginatedPackage): Promise<PaginatedTotal<PackagePublicItem[]>> {
    const response = await this.client.get({
      url: '/public/packages',
      params: {
        page,
        limit,
        currency,
      },
    });
    return response as unknown as PaginatedTotal<PackagePublicItem[]>;
  }
  async getBranchServices(
    {
      page = 1,
      limit = 10,
      currency,
      category,
      price,
      sortby,
      search,
      sort = 'desc',
    }: PublicPaginationService,
    branchId: string,
  ): Promise<PaginatedTotal<ServicePublicItem[]>> {
    const response = await this.client.get({
      url: `/public/branches/${branchId}/services`,
      params: {
        page,
        limit,
        currency,
        category,
        price,
        sortby,
        search,
        sort,
      },
    });
    return response as unknown as PaginatedTotal<ServicePublicItem[]>;
  }
}
