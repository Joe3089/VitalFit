import type {
  AddToWishlistRequest,
  PaginatedTotal,
  PaginationRequest,
  WishlistItemResponse,
} from '@/types';
import { Client } from '../client';

export class WishListService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.addToWishList = this.addToWishList.bind(this);
    this.removeFromWishList = this.removeFromWishList.bind(this);
    this.getWishList = this.getWishList.bind(this);
  }
  async addToWishList(data: AddToWishlistRequest, jwt: string): Promise<void> {
    await this.client.post({
      url: `/wishlist`,
      jwt,
      data,
    });
  }

  async removeFromWishList(wishlistId: string, jwt: string): Promise<void> {
    await this.client.delete({
      url: `/wishlist/${wishlistId}`,
      jwt,
    });
  }

  async getWishList(
    jwt: string,
    { page = 10, limit = 10, sort = 'desc', search }: PaginationRequest,
  ): Promise<PaginatedTotal<WishlistItemResponse>> {
    const response = await this.client.get({
      url: `/wishlist`,
      jwt,
      params: {
        page,
        limit,
        sort,
        search,
      },
    });
    return response as unknown as PaginatedTotal<WishlistItemResponse>;
  }
}
