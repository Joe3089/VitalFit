import type {
  CancellationReason,
  ClientMembershipDetail,
  ClientMembershipItem,
  CreateCancellationReason,
  CreateMembershipType,
  DataResponse,
  MembershipsSummary,
  MembershipType,
  PaginatedTotal,
  PaginationRequest,
  PublicMembershipResponse,
  UpdateClientMembershipRequest,
  UpdateMembershipType,
} from '@/types';
import { Client } from '../client';

export class MembershipService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.createMembershipType = this.createMembershipType.bind(this);
    this.getMembershipTypes = this.getMembershipTypes.bind(this);
    this.getSummary = this.getSummary.bind(this);
    this.getMembershipTypeByID = this.getMembershipTypeByID.bind(this);
    this.updateMembershipType = this.updateMembershipType.bind(this);
    this.deleteMembershipType = this.deleteMembershipType.bind(this);
    this.publicGetMemberships = this.publicGetMemberships.bind(this);

    this.getClientMemberships = this.getClientMemberships.bind(this);
    this.getClientMembershipByID = this.getClientMembershipByID.bind(this);
    this.updateClientMembership = this.updateClientMembership.bind(this);

    this.createCancelReason = this.createCancelReason.bind(this);
    this.getCancelReasons = this.getCancelReasons.bind(this);
    this.updateCancelReason = this.updateCancelReason.bind(this);
    this.deleteCancelReason = this.deleteCancelReason.bind(this);

    this.getMyMemberships = this.getMyMemberships.bind(this);
  }

  async createMembershipType(
    data: CreateMembershipType,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: '/membership-plans',
      jwt,
      data,
    });
  }

  async getMembershipTypes(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<MembershipType[]>> {
    const response = await this.client.get({
      url: '/membership-plans',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<MembershipType[]>;
  }

  async getSummary(jwt: string): Promise<DataResponse<MembershipsSummary>> {
    const response = await this.client.get({
      url: '/membership-plans/summary',
      jwt,
    });
    return response as unknown as DataResponse<MembershipsSummary>;
  }

  async getMembershipTypeByID(
    membershipTypeId: string,
    jwt: string,
  ): Promise<DataResponse<MembershipType>> {
    const response = await this.client.get({
      url: `/membership-plans/${membershipTypeId}`,
      jwt,
    });
    return response as unknown as DataResponse<MembershipType>;
  }

  async updateMembershipType(
    membershipTypeId: string,
    data: UpdateMembershipType,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/membership-plans/${membershipTypeId}`,
      jwt,
      data,
    });
  }

  async deleteMembershipType(
    membershipTypeId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/membership-plans/${membershipTypeId}`,
      jwt,
    });
  }

  async publicGetMemberships(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
    currency: string,
  ): Promise<PaginatedTotal<PublicMembershipResponse[]>> {
    const response = await this.client.get({
      url: '/public/membership-plans',
      jwt,
      params: {
        currency,
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<PublicMembershipResponse[]>;
  }

  async getClientMemberships(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<ClientMembershipItem[]>> {
    const response = await this.client.get({
      url: '/client-memberships',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<ClientMembershipItem[]>;
  }

  async getClientMembershipByID(
    membershipId: string,
    jwt: string,
  ): Promise<DataResponse<ClientMembershipDetail>> {
    const response = await this.client.get({
      url: `/client-memberships/${membershipId}`,
      jwt,
    });
    return response as unknown as DataResponse<ClientMembershipDetail>;
  }

  async updateClientMembership(
    membershipId: string,
    data: UpdateClientMembershipRequest,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/client-memberships/${membershipId}`,
      jwt,
      data,
    });
  }

  async createCancelReason(
    data: CreateCancellationReason,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: '/memberships/cancellation-reasons',
      jwt,
      data,
    });
  }

  async getCancelReasons(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<CancellationReason[]>> {
    const response = await this.client.get({
      url: '/memberships/cancellation-reasons',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<CancellationReason[]>;
  }

  async updateCancelReason(
    reasonId: string,
    data: CreateCancellationReason,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/memberships/cancellation-reasons/${reasonId}`,
      jwt,
      data,
    });
  }

  async deleteCancelReason(reasonId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/memberships/cancellation-reasons/${reasonId}`,
      jwt,
    });
  }

  async getMyMemberships(
    jwt: string,
  ): Promise<DataResponse<ClientMembershipItem>> {
    const response = await this.client.get({
      url: '/client-memberships/me',
      jwt,
    });
    return response as unknown as DataResponse<ClientMembershipItem>;
  }
}
