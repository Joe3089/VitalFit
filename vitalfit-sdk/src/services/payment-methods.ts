import { Client } from '../client';
import type {
  BranchPaymentMethodInfo,
  CreatePaymentMethod,
  DataResponse,
  PaymentMethod,
  UpdateBranchPaymentMethod,
} from '@/types';

export class PaymentMethodService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getPaymentMethods = this.getPaymentMethods.bind(this);
    this.getPaymentMethodByID = this.getPaymentMethodByID.bind(this);
    this.createPaymentMethod = this.createPaymentMethod.bind(this);
    this.updatePaymentMethod = this.updatePaymentMethod.bind(this);
    this.deletePaymentMethod = this.deletePaymentMethod.bind(this);

    this.addBranchPaymentMethod = this.addBranchPaymentMethod.bind(this);
    this.removeBranchPaymentMethod = this.removeBranchPaymentMethod.bind(this);
    this.getBranchPaymentMethods = this.getBranchPaymentMethods.bind(this);
    this.getBranchPaymentMethodByID =
      this.getBranchPaymentMethodByID.bind(this);
    this.updateBranchPaymentMethod = this.updateBranchPaymentMethod.bind(this);
  }

  async getPaymentMethods(jwt: string): Promise<DataResponse<PaymentMethod[]>> {
    const response = await this.client.get({
      url: '/billing/payment-methods',
      jwt,
    });
    return response as unknown as DataResponse<PaymentMethod[]>;
  }
  async createPaymentMethod(
    paymentMethodData: CreatePaymentMethod,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: '/billing/payment-methods',
      jwt,
      data: paymentMethodData,
    });
  }

  async getPaymentMethodByID(
    paymentMethodId: string,
    jwt: string,
  ): Promise<DataResponse<PaymentMethod>> {
    const response = await this.client.get({
      url: `/billing/payment-methods/${paymentMethodId}`,
      jwt,
    });
    return response as unknown as DataResponse<PaymentMethod>;
  }

  async updatePaymentMethod(
    paymentMethodId: string,
    data: CreatePaymentMethod,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/billing/payment-methods/${paymentMethodId}`,
      jwt,
      data,
    });
  }

  async deletePaymentMethod(
    paymentMethodId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/billing/payment-methods/${paymentMethodId}`,
      jwt,
    });
  }

  async addBranchPaymentMethod(
    branchId: string,
    paymentMethodID: string[],
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/branches/${branchId}/payment-methods`,
      jwt,
      data: {
        method_id: paymentMethodID,
      },
    });
  }

  async getBranchPaymentMethods(
    branchId: string,
    jwt: string,
  ): Promise<DataResponse<BranchPaymentMethodInfo[]>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/payment-methods`,
      jwt,
    });
    return response as unknown as DataResponse<BranchPaymentMethodInfo[]>;
  }

  async getBranchPaymentMethodByID(
    branchId: string,
    paymentMethodId: string,
    jwt: string,
  ): Promise<DataResponse<BranchPaymentMethodInfo>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/payment-methods/${paymentMethodId}`,
      jwt,
    });
    return response as unknown as DataResponse<BranchPaymentMethodInfo>;
  }

  async removeBranchPaymentMethod(
    branchId: string,
    paymentMethodId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/branches/${branchId}/payment-methods/${paymentMethodId}`,
      jwt,
    });
  }

  async updateBranchPaymentMethod(
    branchId: string,
    paymentMethodId: string,
    data: UpdateBranchPaymentMethod,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/branches/${branchId}/payment-methods/${paymentMethodId}`,
      jwt,
      data: data,
    });
  }
}
