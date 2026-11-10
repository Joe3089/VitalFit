export type Banner = {
  banner_id?: string;
  image_url?: string;
  is_active?: boolean;
  link_url?: string;
  name?: string;
};

export type RandomBanner = {
  image_url: string;
  service_id: string;
};

export type Promotion = {
  code: string;
  created_at: string;
  discount_type: string;
  discount_value: number;
  end_date: string;
  is_active: boolean;
  name: string;
  promotion_id: string;
  start_date: string;
  updated_at: string;
};

export type CreatePromotion = Omit<
  Promotion,
  'promotion_id' | 'created_at' | 'updated_at'
>;

export type CreateBanner = Omit<Banner, 'banner_id'>;

export type UpdateBanner = {
  image_url?: string;
  is_active?: boolean;
  link_url?: string;
  name?: string;
};
