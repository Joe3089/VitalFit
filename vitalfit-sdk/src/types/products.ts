import type { PaginationRequest } from './utils';

export interface ServiceCategoryInfo {
  category_id: string;
  name: string;
}

export interface ServiceImageResponse {
  image_id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
}

export interface BannerResponse {
  banner_id: string;
  name: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
}

export interface ServiceFullDetail {
  service_id: string;
  category_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  priority_score: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;

  service_category: ServiceCategoryInfo;
  images: ServiceImageResponse[];
  banners: BannerResponse[];
}

export type CreateServiceImage = {
  alt_text: string;
  display_order: number;
  image_url: string;
  is_primary: boolean;
};

export type CreateService = {
  banner_id: string;
  category_id: string;
  description: string;
  duration: number;
  is_featured: boolean;
  name: string;
  priority: number;
  service_images: CreateServiceImage[];
};

export type UpdateServiceImageManual = {
  alt_text?: string;
  display_order?: number;
  image_url?: string;
  is_primary?: boolean;
};

export type UpdateServiceManual = {
  banner_id?: string;
  category_id?: string;
  description?: string;
  duration?: number;
  is_featured?: boolean;
  name?: string;
  priority?: number;
  service_images?: UpdateServiceImageManual[];
};

export type BranchServicePrice = {
  branch_id: string;
  service_id: string;
  service_name: string;
  is_visible: boolean;
  max_capacity: number;
  price_for_member: number;
  price_for_non_member: number;
};

export type CreateBranchServicePriceItem = {
  service_id: string;
  is_visible: boolean;
  max_capacity: number;
  price_for_member: number;
  price_for_non_member: number;
};

export type UpdateBranchServicePrice = {
  is_visible?: boolean;
  max_capacity?: number;
  price_for_member?: number;
  price_for_non_member?: number;
};

export type PaginatedServiceRequest = PaginationRequest & {
  category?: string;
};

export type ServicesSummary = {
  total: number;
  actives: number;
  featured: number;
};

export type ServicePublicItem = ServiceFullDetail & {
  lowest_price_member: number;
  lowest_price_no_member: number;
  base_currency: string;
  ref_lowest_price_member: string;
  ref_lowest_price_no_member: string;
  ref_base_currency: string;
};

export type PublicPaginationService = PaginationRequest & {
  currency: string;
  category: string;
  price: number;
  sortby: string;
};
