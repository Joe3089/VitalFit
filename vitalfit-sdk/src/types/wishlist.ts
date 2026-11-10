export type AddToWishlistRequest = {
  service_id: string;
};

export type WishlistItemResponse = {
  wishlist_id: string;
  service_id: string;
  service_name: string;
  description: string;
  created_at: string;
};
