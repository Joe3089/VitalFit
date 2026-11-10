import type { AuditLog, PaginatedTotal, PaginationRequest } from '@/types';
import { Client } from '../client';

export class AuditService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getUserLogs = this.getUserLogs.bind(this);
    this.getAllLogs = this.getAllLogs.bind(this);
  }

  async getAllLogs(
    jwt: string,
    userId: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<AuditLog[]>> {
    const response = await this.client.get({
      url: `/audit-logs`,
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<AuditLog[]>;
  }

  async getUserLogs(
    jwt: string,
    userId: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<AuditLog[]>> {
    const response = await this.client.get({
      url: `/audit-logs/user/${userId}`,
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<AuditLog[]>;
  }
}
