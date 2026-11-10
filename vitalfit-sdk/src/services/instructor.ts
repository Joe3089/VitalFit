import type {
  AssignedClientResponse,
  Instructor,
  DataResponse,
  InstructorDataList,
  PaginatedInstructor,
  InstructorData,
  Specialty,
  BranchInstructorInfo,
  PaginatedTotal,
  PaginationRequest,
  InstructorsSummary,
} from '@/types';
import { Client } from '../client';

export class InstructorService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getInstructors = this.getInstructors.bind(this);
    this.getSummary = this.getSummary.bind(this);
    this.createInstructor = this.createInstructor.bind(this);
    this.getInstructorById = this.getInstructorById.bind(this);
    this.updateInstructor = this.updateInstructor.bind(this);
    this.deleteInstructor = this.deleteInstructor.bind(this);
    this.addSpecialty = this.addSpecialty.bind(this);
    this.removeSpecialty = this.removeSpecialty.bind(this);

    this.getAssignedClients = this.getAssignedClients.bind(this);
    this.addBranchInstructor = this.addBranchInstructor.bind(this);
    this.removeBranchInstructor = this.removeBranchInstructor.bind(this);
    this.getBranchInstructors = this.getBranchInstructors.bind(this);
  }

  async getInstructors(
    { page = 10, limit = 10, search, identity_doc }: PaginatedInstructor,
    jwt: string,
  ): Promise<PaginatedTotal<InstructorDataList[]>> {
    const response = await this.client.get({
      url: '/instructor',
      jwt,
      params: {
        page,
        limit,
        search,
        identity_doc,
      },
    });
    return response as unknown as PaginatedTotal<InstructorDataList[]>;
  }

  async getSummary(jwt: string): Promise<DataResponse<InstructorsSummary>> {
    const response = await this.client.get({
      url: '/instructor/summary',
      jwt,
    });
    return response as unknown as DataResponse<InstructorsSummary>;
  }

  async createInstructor(
    instructorData: Instructor,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: '/instructor',
      jwt,
      data: instructorData,
    });
  }

  async getInstructorById(
    instructorId: string,
    jwt: string,
  ): Promise<DataResponse<InstructorData>> {
    const response = await this.client.get({
      url: `/instructor/${instructorId}`,
      jwt,
    });
    return response as unknown as DataResponse<InstructorData>;
  }

  async updateInstructor(
    instructorId: string,
    instructorData: Instructor,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/instructor/${instructorId}`,
      jwt,
      data: instructorData,
    });
  }

  async deleteInstructor(instructorId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/instructor/${instructorId}`,
      jwt,
    });
  }

  async addSpecialty(
    instructorId: string,
    specialty: Specialty[],
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/instructor/${instructorId}/specialty`,
      jwt,
      data: {
        specialties: specialty,
      },
    });
  }

  async removeSpecialty(
    instructorId: string,
    specialtyId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/instructor/${instructorId}/specialty/${specialtyId}`,
      jwt,
    });
  }

  async getAssignedClients(
    jwt: string,
    instructorId?: string,
    { page = 1, limit = 10, sort = 'desc', search }: PaginationRequest = {},
  ): Promise<PaginatedTotal<AssignedClientResponse[]>> {
    const response = await this.client.get({
      url: `/instructor/${instructorId}/clients`,
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<AssignedClientResponse[]>;
  }

  async addBranchInstructor(
    branchId: string,
    instructorIDs: string[],
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/branches/${branchId}/instructor`,
      jwt,
      data: {
        instructor: instructorIDs,
      },
    });
  }
  async removeBranchInstructor(
    branchId: string,
    instructorId: string,
    jwt: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/branches/${branchId}/instructor/${instructorId}`,
      jwt,
    });
  }

  async getBranchInstructors(
    branchId: string,
    { search, identity_doc }: PaginatedInstructor,
    jwt: string,
  ): Promise<DataResponse<BranchInstructorInfo[]>> {
    const response = await this.client.get({
      url: `/branches/${branchId}/instructor`,
      jwt,
      params: {
        search,
        identity_doc,
      },
    });
    return response as unknown as DataResponse<BranchInstructorInfo[]>;
  }
}
