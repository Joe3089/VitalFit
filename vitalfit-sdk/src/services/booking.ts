import type {
  BookClassRequest,
  BookingParticipant,
  BranchScheduleResponse,
  ClassBookingCount,
  ClientBookingResponse,
  DataResponse,
  PaginatedTotal,
  PaginationRequest,
} from '@/types';
import { Client } from '../client';
//booking
export class BookingService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.bookClass = this.bookClass.bind(this);
    this.cancelBooking = this.cancelBooking.bind(this);
    this.getClientBooking = this.getClientBooking.bind(this);
    this.getClientBranchBooking = this.getClientBranchBooking.bind(this);
    this.getClassBookingCount = this.getClassBookingCount.bind(this);
    this.getBookingClass = this.getBookingClass.bind(this);
  }

  async bookClass(
    data: BookClassRequest,
    classID: string,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: `/schedule/${classID}/book`,
      jwt,
      data,
    });
  }

  async cancelBooking(bookingId: string, jwt: string): Promise<void> {
    await this.client.patch({
      url: `/bookings/${bookingId}/cancel`,
      jwt,
    });
  }

  async getClientBooking(
    userID: string,
    jwt: string,
    month?: number,
    year?: number,
    date?: string,
  ): Promise<DataResponse<ClientBookingResponse[]>> {
    const response = await this.client.get({
      url: `/bookings/client/${userID}`,
      jwt,
      params: {
        month,
        year,
        date,
      },
    });
    return response as unknown as DataResponse<ClientBookingResponse[]>;
  }

  async getClientBranchBooking(
    branchID: string,
    userID: string,
    jwt: string,
    month?: number,
    year?: number,
    date?: string,
  ): Promise<DataResponse<BranchScheduleResponse[]>> {
    const response = await this.client.get({
      url: `/schedule/branch/${branchID}/client/${userID}`,
      jwt,
      params: {
        month,
        year,
        date,
      },
    });
    return response as unknown as DataResponse<BranchScheduleResponse[]>;
  }
  async getClassBookingCount(
    classID: string,
    jwt: string,
  ): Promise<ClassBookingCount> {
    const response = await this.client.get({
      url: `/schedule/${classID}/bookings/count`,
      jwt,
    });
    return response as unknown as ClassBookingCount;
  }
  async getBookingClass(
    classID: string,
    jwt: string,
    { page = 10, limit = 10, sort = 'desc' }: PaginationRequest,
  ): Promise<PaginatedTotal<BookingParticipant[]>> {
    const response = await this.client.get({
      url: `/bookings/class/${classID}`,
      jwt,
      params: {
        page,
        limit,
        sort,
      },
    });
    return response as unknown as PaginatedTotal<BookingParticipant[]>;
  }
}
