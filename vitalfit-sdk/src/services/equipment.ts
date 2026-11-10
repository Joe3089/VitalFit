import type {
  BranchEquipmentInventory,
  CreateBranchEquipment,
  CreateEquipment,
  DataResponse,
  Equipment,
  EquipmentInfo,
  PaginatedEquipmentRequest,
  PaginatedTotal,
  UpdateBranchEquipmentDetails,
  UpdateEquipment,
} from '@/types';
import { Client } from '../client';

export class EquipmentService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getEquipment = this.getEquipment.bind(this);
    this.getEquipmentByID = this.getEquipmentByID.bind(this);
    this.createEquipment = this.createEquipment.bind(this);
    this.updateEquipment = this.updateEquipment.bind(this);
    this.deleteEquipment = this.deleteEquipment.bind(this);

    this.getBranchEquipment = this.getBranchEquipment.bind(this);
    this.getBranchEquipmentByID = this.getBranchEquipmentByID.bind(this);
    this.addBranchEquipment = this.addBranchEquipment.bind(this);
    this.removeBranchEquipment = this.removeBranchEquipment.bind(this);
    this.updateBranchEquipment = this.updateBranchEquipment.bind(this);
  }

  async getEquipment(
    jwt: string,
    {
      page = 10,
      limit = 10,
      sort = 'desc',
      search,
      category,
    }: PaginatedEquipmentRequest,
  ): Promise<PaginatedTotal<Equipment[]>> {
    const response = await this.client.get({
      url: '/equipment-types',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
        category,
      },
    });
    return response as unknown as PaginatedTotal<Equipment[]>;
  }

  async getEquipmentByID(
    equipmentId: string,
    jwt: string,
  ): Promise<DataResponse<EquipmentInfo>> {
    const response = await this.client.get({
      url: `/equipment-types/${equipmentId}`,
      jwt,
    });
    return response as unknown as DataResponse<EquipmentInfo>;
  }
  async getBranchEquipmentByID(
    branchId: string,
    equipmentID: string,
    jwt: string,
  ): Promise<DataResponse<BranchEquipmentInventory>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/equipment/${equipmentID}`,
      jwt,
    });
    return response as unknown as DataResponse<BranchEquipmentInventory>;
  }

  async createEquipment(data: CreateEquipment, jwt: string): Promise<void> {
    await this.client.post({
      url: '/equipment-types',
      jwt,
      data,
    });
  }

  async updateEquipment(
    equipmentId: string,
    data: UpdateEquipment,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/equipment-types/${equipmentId}`,
      jwt,
      data,
    });
  }

  async deleteEquipment(equipmentId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/equipment-types/${equipmentId}`,
      jwt,
    });
  }

  async getBranchEquipment(
    branchId: string,
    jwt: string,
  ): Promise<DataResponse<BranchEquipmentInventory[]>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/equipment`,
      jwt,
    });
    return response as unknown as DataResponse<BranchEquipmentInventory[]>;
  }

  async addBranchEquipment(
    branchId: string,
    equipmentData: CreateBranchEquipment,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/branches/${branchId}/equipment`,
      jwt,
      data: equipmentData,
    });
  }

  async removeBranchEquipment(
    branchId: string,
    equipmentId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/branches/${branchId}/equipment/${equipmentId}`,
      jwt,
    });
  }

  async updateBranchEquipment(
    branchId: string,
    equipmentId: string,
    data: UpdateBranchEquipmentDetails,
    jwt: string,
  ): Promise<void> {
    await this.client.patch({
      url: `/branches/${branchId}/equipment/${equipmentId}`,
      jwt,
      data: data,
    });
  }
}
