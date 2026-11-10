import type {
  Banner,
  CreateBanner,
  CreatePromotion,
  PaginatedTotal,
  PaginationRequest,
  Promotion,
  RandomBanner,
  UpdateBanner,
} from '@/types';
import { Client } from '../client';
import type { DataResponse } from '../types';

export class MarketingService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.createBanners = this.createBanners.bind(this);
    this.getBanner = this.getBanner.bind(this);
    this.getBannerByID = this.getBannerByID.bind(this);
    this.updateBanner = this.updateBanner.bind(this);
    this.deleteBanner = this.deleteBanner.bind(this);

    this.createPromotion = this.createPromotion.bind(this);
    this.getPromotion = this.getPromotion.bind(this);
    this.getPromotionByID = this.getPromotionByID.bind(this);
    this.updatePromotion = this.updatePromotion.bind(this);
    this.deletePromotion = this.deletePromotion.bind(this);

    this.getRandomBanner = this.getRandomBanner.bind(this);
  }

  async createBanners(BannerData: CreateBanner, jwt: string): Promise<void> {
    await this.client.post({
      url: '/marketing/banners',
      jwt,
      data: BannerData,
    });
  }

  async getBanner(jwt: string): Promise<DataResponse<Banner[]>> {
    const response = await this.client.get({
      url: '/marketing/banners',
      jwt,
    });
    return response as unknown as DataResponse<Banner[]>;
  }

  async getBannerByID(
    BannerId: string,
    jwt: string,
  ): Promise<DataResponse<Banner>> {
    const response = await this.client.get({
      url: `/marketing/banners/${BannerId}`,
      jwt,
    });
    return response as unknown as DataResponse<Banner>;
  }

  async updateBanner(
    BannerId: string,
    BannerData: UpdateBanner,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/marketing/banners/${BannerId}`,
      jwt,
      data: BannerData,
    });
  }

  async deleteBanner(BannerId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/marketing/banners/${BannerId}`,
      jwt,
    });
  }

  async createPromotion(
    promotionData: CreatePromotion,
    jwt: string,
  ): Promise<void> {
    await this.client.post({
      url: '/marketing/promotions',
      jwt,
      data: promotionData,
    });
  }

  async getPromotion(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<Promotion[]>> {
    const response = await this.client.get({
      url: '/marketing/promotions',
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<Promotion[]>;
  }

  async getPromotionByID(
    promotionId: string,
    jwt: string,
  ): Promise<DataResponse<Promotion>> {
    const response = await this.client.get({
      url: `/marketing/promotions/${promotionId}`,
      jwt,
    });
    return response as unknown as DataResponse<Promotion>;
  }

  async updatePromotion(
    promotionId: string,
    promotionData: CreatePromotion,
    jwt: string,
  ): Promise<void> {
    await this.client.put({
      url: `/marketing/promotions/${promotionId}`,
      jwt,
      data: promotionData,
    });
  }

  async deletePromotion(promotionId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/marketing/promotions/${promotionId}`,
      jwt,
    });
  }

  async getRandomBanner(): Promise<DataResponse<RandomBanner>> {
    const response = await this.client.get({
      url: '/marketing/banners/random',
    });
    return response as unknown as DataResponse<RandomBanner>;
  }
}
