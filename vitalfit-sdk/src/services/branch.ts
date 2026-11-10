import type { Pagination, CreateBranchRequest, DataResponse } from '@/types';
import type {
  PaginatedBranch,
  PaginationBranchRequest,
  BranchStatusCount,
  BranchDetails,
  UpdateBranchRequest,
} from '../types/branch';

export class BranchService {
  private client: any;

  constructor(client: any) {
    this.client = client;
    this.getBranches = this.getBranches.bind(this);
    this.delete = this.delete.bind(this);
    this.getBranchStatusCount = this.getBranchStatusCount.bind(this);
    this.createBranch = this.createBranch.bind(this);
    this.getBranchById = this.getBranchById.bind(this);
    this.updateBranch = this.updateBranch.bind(this);
  }

  async updateBranch(
    branchId: string,
    branchData: UpdateBranchRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/branches/${branchId}`,
      jwt,
      data: branchData,
    });
  }

  async getBranchById(branchId: string, jwt: string): Promise<BranchDetails> {
    const response = await this.client.get({
      url: `/branches/${branchId}`,
      jwt,
    });
    return response as unknown as BranchDetails;
  }

  async getBranches(
    { page = 1, limit = 10, search, status, location }: PaginationBranchRequest,
    jwt: string,
  ): Promise<Pagination<PaginatedBranch[]>> {
    const response = await this.client.get({
      url: '/branches',
      jwt,
      params: {
        page,
        limit,
        search,
        status,
        location,
      },
    });
    return response as unknown as Pagination<PaginatedBranch[]>;
  }

  async delete(branchId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/branches/${branchId}`,
      jwt,
    });
  }

  async getBranchStatusCount(
    jwt: string,
  ): Promise<DataResponse<BranchStatusCount>> {
    const response = await this.client.get({
      url: '/branches/status',
      jwt,
    });
    return response as unknown as DataResponse<BranchStatusCount>;
  }

  async createBranch(
    branchData: CreateBranchRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: '/branches',
      jwt,
      data: branchData,
    });
  }
}
