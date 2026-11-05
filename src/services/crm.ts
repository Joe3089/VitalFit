import type {
  ClientFeedback,
  ClientScoreBreakdown,
  ClientTag,
  ContactMessage,
  ContactMessageStatus,
  ContactRequest,
  CreateFeedbackRequest,
  DataResponse,
  FeedbackFilter,
  NPSRequest,
  PagedResponse,
  SegmentCount,
  UpdateFeedbackRequest,
} from '@/types';
import { Client } from '../client';

/**
 * Client relationship management: complaints & suggestions, tags,
 * scoring/segmentation, NPS surveys and the public contact form.
 */
export class CRMService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.listFeedback = this.listFeedback.bind(this);
    this.createFeedback = this.createFeedback.bind(this);
    this.updateFeedback = this.updateFeedback.bind(this);
    this.createOwnFeedback = this.createOwnFeedback.bind(this);
    this.listOwnFeedback = this.listOwnFeedback.bind(this);
    this.listTags = this.listTags.bind(this);
    this.createTag = this.createTag.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
    this.getClientTags = this.getClientTags.bind(this);
    this.assignTag = this.assignTag.bind(this);
    this.unassignTag = this.unassignTag.bind(this);
    this.getClientScore = this.getClientScore.bind(this);
    this.getSegments = this.getSegments.bind(this);
    this.recalculateSegments = this.recalculateSegments.bind(this);
    this.submitNPS = this.submitNPS.bind(this);
    this.sendContactMessage = this.sendContactMessage.bind(this);
    this.listContactMessages = this.listContactMessages.bind(this);
    this.updateContactMessage = this.updateContactMessage.bind(this);
  }

  // ---- Complaints & suggestions ----

  async listFeedback(
    jwt: string,
    filter: FeedbackFilter = {},
  ): Promise<PagedResponse<ClientFeedback[]>> {
    return this.client.get({ url: '/crm/feedback', jwt, params: filter });
  }

  async createFeedback(
    jwt: string,
    data: CreateFeedbackRequest,
  ): Promise<ClientFeedback> {
    return this.client.post({ url: '/crm/feedback', jwt, data });
  }

  async updateFeedback(
    jwt: string,
    feedbackId: string,
    data: UpdateFeedbackRequest,
  ): Promise<ClientFeedback> {
    return this.client.patch({ url: `/crm/feedback/${feedbackId}`, jwt, data });
  }

  async createOwnFeedback(
    jwt: string,
    data: Omit<CreateFeedbackRequest, 'user_id'>,
  ): Promise<ClientFeedback> {
    return this.client.post({ url: '/me/feedback', jwt, data });
  }

  async listOwnFeedback(
    jwt: string,
    page = 1,
    limit = 10,
  ): Promise<PagedResponse<ClientFeedback[]>> {
    return this.client.get({
      url: '/me/feedback',
      jwt,
      params: { page, limit },
    });
  }

  // ---- Tags ----

  async listTags(jwt: string): Promise<DataResponse<ClientTag[]>> {
    return this.client.get({ url: '/crm/tags', jwt });
  }

  async createTag(
    jwt: string,
    name: string,
    color?: string,
  ): Promise<ClientTag> {
    return this.client.post({ url: '/crm/tags', jwt, data: { name, color } });
  }

  async deleteTag(jwt: string, tagId: string): Promise<void> {
    await this.client.delete({ url: `/crm/tags/${tagId}`, jwt });
  }

  async getClientTags(
    jwt: string,
    clientId: string,
  ): Promise<DataResponse<ClientTag[]>> {
    return this.client.get({ url: `/crm/clients/${clientId}/tags`, jwt });
  }

  async assignTag(jwt: string, clientId: string, tagId: string): Promise<void> {
    await this.client.post({
      url: `/crm/clients/${clientId}/tags`,
      jwt,
      data: { tag_id: tagId },
    });
  }

  async unassignTag(
    jwt: string,
    clientId: string,
    tagId: string,
  ): Promise<void> {
    await this.client.delete({
      url: `/crm/clients/${clientId}/tags/${tagId}`,
      jwt,
    });
  }

  // ---- Scoring & segmentation ----

  async getClientScore(
    jwt: string,
    clientId: string,
  ): Promise<ClientScoreBreakdown> {
    return this.client.get({ url: `/crm/clients/${clientId}/score`, jwt });
  }

  async getSegments(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<SegmentCount[]>> {
    return this.client.get({
      url: '/crm/segments',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
  }

  async recalculateSegments(
    jwt: string,
  ): Promise<{ scored: number; segmented: number }> {
    return this.client.post({ url: '/crm/segments/recalculate', jwt });
  }

  // ---- NPS ----

  async submitNPS(jwt: string, data: NPSRequest): Promise<void> {
    await this.client.post({ url: '/nps', jwt, data });
  }

  // ---- Contact form ----

  /** Public endpoint, no authentication required. */
  async sendContactMessage(data: ContactRequest): Promise<void> {
    await this.client.post({ url: '/public/contact', data });
  }

  async listContactMessages(
    jwt: string,
    status?: ContactMessageStatus,
    page = 1,
    limit = 10,
  ): Promise<PagedResponse<ContactMessage[]>> {
    return this.client.get({
      url: '/crm/contact-messages',
      jwt,
      params: { status, page, limit },
    });
  }

  async updateContactMessage(
    jwt: string,
    messageId: string,
    status: ContactMessageStatus,
  ): Promise<void> {
    await this.client.patch({
      url: `/crm/contact-messages/${messageId}`,
      jwt,
      data: { status },
    });
  }
}
