import type {
  ChatRequest,
  ChatResponse,
  Message,
  PaginatedTotal,
  PaginationRequest,
} from '@/types';
import { Client } from '../client';

export class LLMService {
  private client: Client;
  constructor(client: Client) {
    this.client = client;
    this.chat = this.chat.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.resetChat = this.resetChat.bind(this);
  }

  async chat(data: ChatRequest, jwt: string): Promise<ChatResponse> {
    const response = await this.client.post({
      url: '/llm/chat',
      jwt,
      data,
    });
    return response as unknown as ChatResponse;
  }

  async getHistory(
    jwt: string,
    { page = 1, limit = 50, sort = 'desc' }: PaginationRequest = {},
  ): Promise<PaginatedTotal<Message[]>> {
    const response = await this.client.get({
      url: '/llm/history',
      jwt,
      params: {
        page,
        limit,
        sort,
      },
    });
    return response as unknown as PaginatedTotal<Message[]>;
  }

  async resetChat(jwt: string): Promise<{ message: string }> {
    const response = await this.client.post({
      url: '/llm/reset',
      jwt,
    });
    return response as unknown as { message: string };
  }
}
