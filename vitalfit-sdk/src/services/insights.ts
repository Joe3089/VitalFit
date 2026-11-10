import type {
  BenchmarkReport,
  BIAPIKey,
  ChurnRiskClient,
  ConversionStats,
  DataResponse,
  DateRangeParams,
  KPIAlert,
  NPSSummary,
  ReportFormat,
  ReportSchedule,
  ReportScheduleRequest,
  ReportShareLink,
  ReportTemplate,
  ReportTemplateRequest,
  ReportType,
  RevPASReport,
  ShareLinkRequest,
  WebEventType,
} from '@/types';
import { Client } from '../client';

/**
 * Advanced analytics (conversion, NPS, RevPAS, benchmarking, churn risk,
 * anomaly alerts) and report automation (templates, schedules, shared links,
 * BI API keys).
 */
export class InsightsService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.trackWebEvent = this.trackWebEvent.bind(this);
    this.getConversion = this.getConversion.bind(this);
    this.getNPS = this.getNPS.bind(this);
    this.getRevPAS = this.getRevPAS.bind(this);
    this.getBenchmark = this.getBenchmark.bind(this);
    this.getChurnRisk = this.getChurnRisk.bind(this);
    this.listAlerts = this.listAlerts.bind(this);
    this.acknowledgeAlert = this.acknowledgeAlert.bind(this);
    this.detectAlerts = this.detectAlerts.bind(this);
    this.downloadReport = this.downloadReport.bind(this);
    this.listTemplates = this.listTemplates.bind(this);
    this.createTemplate = this.createTemplate.bind(this);
    this.updateTemplate = this.updateTemplate.bind(this);
    this.deleteTemplate = this.deleteTemplate.bind(this);
    this.listSchedules = this.listSchedules.bind(this);
    this.createSchedule = this.createSchedule.bind(this);
    this.updateSchedule = this.updateSchedule.bind(this);
    this.deleteSchedule = this.deleteSchedule.bind(this);
    this.sendScheduleNow = this.sendScheduleNow.bind(this);
    this.listShareLinks = this.listShareLinks.bind(this);
    this.createShareLink = this.createShareLink.bind(this);
    this.deleteShareLink = this.deleteShareLink.bind(this);
    this.listAPIKeys = this.listAPIKeys.bind(this);
    this.createAPIKey = this.createAPIKey.bind(this);
    this.revokeAPIKey = this.revokeAPIKey.bind(this);
  }

  /** Public, anonymous funnel tracking used for the web conversion rate. */
  async trackWebEvent(
    sessionId: string,
    eventType: WebEventType,
    path?: string,
  ): Promise<void> {
    await this.client.post({
      url: '/public/web-events',
      data: { session_id: sessionId, event_type: eventType, path },
    });
  }

  async getConversion(
    jwt: string,
    range: DateRangeParams = {},
  ): Promise<ConversionStats> {
    return this.client.get({ url: '/insights/conversion', jwt, params: range });
  }

  async getNPS(jwt: string, range: DateRangeParams = {}): Promise<NPSSummary> {
    return this.client.get({ url: '/insights/nps', jwt, params: range });
  }

  async getRevPAS(
    jwt: string,
    range: DateRangeParams = {},
  ): Promise<RevPASReport> {
    return this.client.get({ url: '/insights/revpas', jwt, params: range });
  }

  async getBenchmark(
    jwt: string,
    range: DateRangeParams = {},
  ): Promise<BenchmarkReport> {
    return this.client.get({ url: '/insights/benchmark', jwt, params: range });
  }

  async getChurnRisk(
    jwt: string,
    params: { branch_id?: string; min_score?: number } = {},
  ): Promise<DataResponse<ChurnRiskClient[]>> {
    return this.client.get({ url: '/insights/churn-risk', jwt, params });
  }

  async listAlerts(
    jwt: string,
    params: { open?: boolean; branch_id?: string } = {},
  ): Promise<DataResponse<KPIAlert[]>> {
    return this.client.get({ url: '/insights/alerts', jwt, params });
  }

  async acknowledgeAlert(jwt: string, alertId: string): Promise<void> {
    await this.client.patch({ url: `/insights/alerts/${alertId}/ack`, jwt });
  }

  async detectAlerts(jwt: string): Promise<DataResponse<KPIAlert[]>> {
    return this.client.post({ url: '/insights/alerts/detect', jwt });
  }

  async downloadReport(
    jwt: string,
    params: DateRangeParams & {
      type: ReportType;
      format: ReportFormat;
      template_id?: string;
    },
  ): Promise<{ blob: Blob; filename?: string }> {
    return this.client.download({
      url: '/insights/reports/download',
      jwt,
      params,
    });
  }

  // ---- Templates ----

  async listTemplates(jwt: string): Promise<DataResponse<ReportTemplate[]>> {
    return this.client.get({ url: '/insights/templates', jwt });
  }

  async createTemplate(
    jwt: string,
    data: ReportTemplateRequest,
  ): Promise<ReportTemplate> {
    return this.client.post({ url: '/insights/templates', jwt, data });
  }

  async updateTemplate(
    jwt: string,
    templateId: string,
    data: ReportTemplateRequest,
  ): Promise<ReportTemplate> {
    return this.client.put({
      url: `/insights/templates/${templateId}`,
      jwt,
      data,
    });
  }

  async deleteTemplate(jwt: string, templateId: string): Promise<void> {
    await this.client.delete({ url: `/insights/templates/${templateId}`, jwt });
  }

  // ---- Scheduled reports ----

  async listSchedules(jwt: string): Promise<DataResponse<ReportSchedule[]>> {
    return this.client.get({ url: '/insights/schedules', jwt });
  }

  async createSchedule(
    jwt: string,
    data: ReportScheduleRequest,
  ): Promise<ReportSchedule> {
    return this.client.post({ url: '/insights/schedules', jwt, data });
  }

  async updateSchedule(
    jwt: string,
    scheduleId: string,
    data: ReportScheduleRequest,
  ): Promise<ReportSchedule> {
    return this.client.put({
      url: `/insights/schedules/${scheduleId}`,
      jwt,
      data,
    });
  }

  async deleteSchedule(jwt: string, scheduleId: string): Promise<void> {
    await this.client.delete({ url: `/insights/schedules/${scheduleId}`, jwt });
  }

  async sendScheduleNow(jwt: string, scheduleId: string): Promise<void> {
    await this.client.post({
      url: `/insights/schedules/${scheduleId}/send`,
      jwt,
    });
  }

  // ---- Shared links ----

  async listShareLinks(jwt: string): Promise<DataResponse<ReportShareLink[]>> {
    return this.client.get({ url: '/insights/share-links', jwt });
  }

  /** The returned url is only shown once. */
  async createShareLink(
    jwt: string,
    data: ShareLinkRequest,
  ): Promise<{ url: string; link: ReportShareLink }> {
    return this.client.post({ url: '/insights/share-links', jwt, data });
  }

  async deleteShareLink(jwt: string, linkId: string): Promise<void> {
    await this.client.delete({ url: `/insights/share-links/${linkId}`, jwt });
  }

  // ---- BI API keys ----

  async listAPIKeys(jwt: string): Promise<DataResponse<BIAPIKey[]>> {
    return this.client.get({ url: '/insights/api-keys', jwt });
  }

  /** The plain api_key is only returned once. */
  async createAPIKey(
    jwt: string,
    name: string,
    expiresAt?: string,
  ): Promise<{ api_key: string; key: BIAPIKey }> {
    return this.client.post({
      url: '/insights/api-keys',
      jwt,
      data: { name, expires_at: expiresAt },
    });
  }

  async revokeAPIKey(jwt: string, keyId: string): Promise<void> {
    await this.client.delete({ url: `/insights/api-keys/${keyId}`, jwt });
  }
}
