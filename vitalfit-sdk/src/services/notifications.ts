import type {
  BroadcastRequest,
  DataResponse,
  NotificationResponse,
  PaginationRequest,
  UnreadCountResponse,
} from '@/types';
import { Client } from '../client';

export class NotificationService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.getNotifications = this.getNotifications.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.sendBroadcast = this.sendBroadcast.bind(this);
  }

  async getNotifications(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc' }: PaginationRequest,
  ): Promise<DataResponse<NotificationResponse[]>> {
    const response = await this.client.get({
      url: '/notifications',
      jwt,
      params: {
        page,
        limit,
        sort,
      },
    });
    return response as unknown as DataResponse<NotificationResponse[]>;
  }

  async getUnreadCount(jwt: string): Promise<UnreadCountResponse> {
    const response = await this.client.get({
      url: '/notifications/unread-count',
      jwt,
    });
    return response as unknown as UnreadCountResponse;
  }

  async markAsRead(notificationId: string, jwt: string): Promise<void> {
    await this.client.patch({
      url: `/notifications/${notificationId}/read`,
      jwt,
    });
  }

  async markAllAsRead(jwt: string): Promise<void> {
    await this.client.patch({
      url: '/notifications/read-all',
      jwt,
    });
  }

  async sendBroadcast(data: BroadcastRequest, jwt: string): Promise<void> {
    await this.client.post({
      url: '/notifications/broadcast',
      jwt,
      data,
    });
  }
}
