import type { DataResponse, Policy, updatePolicy } from '@/types';
import { Client } from '../client';

export class PolicyService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getPolicies = this.getPolicies.bind(this);
    this.getPolicyByID = this.getPolicyByID.bind(this);
    this.updatePolicy = this.updatePolicy.bind(this);
  }
  async getPolicies(jwt: string): Promise<DataResponse<Policy[]>> {
    const response = await this.client.get({
      url: '/policies',
      jwt,
    });
    return response as unknown as DataResponse<Policy[]>;
  }
  async getPolicyByID(
    policyId: string,
    jwt: string,
  ): Promise<DataResponse<Policy>> {
    const response = await this.client.get({
      url: `/policies/${policyId}`,
      jwt,
    });
    return response as unknown as DataResponse<Policy>;
  }
  async updatePolicy(
    policyId: string,
    data: updatePolicy,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/policies/${policyId}`,
      jwt,
      data,
    });
  }
}
