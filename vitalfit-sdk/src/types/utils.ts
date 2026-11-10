export type PaginationRequest = {
  limit?: number;
  page?: number;
  sort?: 'asc' | 'desc';
  search?: string;
};

export type Pagination<T> = {
  data: T;
  count: number;
  next: string | null;
  previous: string | null;
};

export type PaginatedTotal<T> = Pagination<T> & {
  total: number;
};

export type UUIDModel = {
  id: string;
};

export type BaseModel = UUIDModel & {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DataResponse<T> = {
  data: T;
};

export type PaginationWithStatus = PaginationRequest & {
  status?: string;
};
