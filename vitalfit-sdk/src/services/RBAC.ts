import { Client } from '../client';
import type {
  CreateRole,
  DataResponse,
  PaginationRequest,
  Permission,
  RoleResponse,
  PaginatedTotal,
} from '@/types';

export class RBACService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getPermissions = this.getPermissions.bind(this);
    this.getRoles = this.getRoles.bind(this);
    this.createRole = this.createRole.bind(this);
    this.updateRole = this.updateRole.bind(this);
    this.getRoleByID = this.getRoleByID.bind(this);
    this.deleteRole = this.deleteRole.bind(this);
    this.addPermission = this.addPermission.bind(this);
    this.removePermission = this.removePermission.bind(this);
  }

  async getPermissions(jwt: string): Promise<DataResponse<Permission[]>> {
    const response = await this.client.get({
      url: '/admin/permissions',
      jwt,
    });
    return response as unknown as DataResponse<Permission[]>;
  }

  async getRoles(
    { page = 10, limit = 10, search, sort = 'desc' }: PaginationRequest,
    jwt: string,
  ): Promise<PaginatedTotal<RoleResponse[]>> {
    const response = await this.client.get({
      url: '/admin/roles',
      jwt,
      params: {
        page,
        limit,
        search,
      },
    });
    return response as unknown as PaginatedTotal<RoleResponse[]>;
  }

  async createRole(roleData: CreateRole, jwt: string): Promise<void> {
    await this.client.post({
      url: '/admin/roles',
      jwt,
      data: roleData,
    });
  }

  async updateRole(
    roleId: string,
    roleData: CreateRole,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/admin/roles/${roleId}`,
      jwt,
      data: roleData,
    });
  }

  async getRoleByID(
    roleId: string,
    jwt: string,
  ): Promise<DataResponse<RoleResponse>> {
    const response = await this.client.get({
      url: `/admin/roles/${roleId}`,
      jwt,
    });
    return response as unknown as DataResponse<RoleResponse>;
  }

  async deleteRole(roleId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/admin/roles/${roleId}`,
      jwt,
    });
  }
  async addPermission(
    roleId: string,
    permissionData: string[],
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/admin/roles/${roleId}/permissions`,
      jwt,
      data: {
        permissions: permissionData,
      },
    });
  }
  async removePermission(
    roleId: string,
    permissionData: Permission[],
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/admin/roles/${roleId}/permissions`,
      jwt,
      data: permissionData,
    });
  }
}
