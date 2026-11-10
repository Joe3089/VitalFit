import type { PaginationRequest } from './utils';

export type PackageItemInput = {
  serviceId: string;
  sessionsIncluded: number;
};

export type PackageItemDetail = {
  name: string;
  serviceId: string;
  sessionsIncluded: number;
};

export type PackageListItem = {
  createdAt: string;
  description: string;
  endAt: string;
  isActive: boolean;
  name: string;
  packageId: string;
  price: number;
  startAt: string;
  updatedAt: string;
};

export type PackageDetail = {
  createdAt: string;
  description: string;
  endAt: string;
  isActive: boolean;
  name: string;
  packageId: string;
  packageItems: PackageItemDetail[];
  price: number;
  startAt: string;
  updatedAt: string;
};

export type CreatePackagePayload = {
  description: string;
  endAt: string;
  name: string;
  packageItems: PackageItemInput[];
  price: number;
  startAt: string;
};

export type UpdatePackagePayload = {
  description: string;
  endAt: string;
  name: string;
  packageItems: PackageItemInput[];
  price: number;
  startAt: string;
};

export type PackagePublicItem = Omit<
  PackageListItem,
  'createdAt' | 'updatedAt'
> & {
  base_currency: string;
  ref_price: string;
  ref_currency: string;
};

export type PublicPaginatedPackage = PaginationRequest & {
  currency: string;
};
