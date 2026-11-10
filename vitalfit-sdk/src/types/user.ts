import type { ServiceFullDetail } from './products';

export type ClientProfile = {
  user_id: string;
  qr_code: string;
  scoring: number;
  category: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Role = {
  role_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ClientMembership = {
  client_membership_id: string;
  user_id: string;
  membership_type_id: string;
  start_date: string;
  end_date: string;
  status: string;
  invoice_id: string;
};

export type User = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  identity_document: string;
  birth_date: string;
  gender: string;
  status: string;
  block_justification: string;
  profile_picture_url: string;
  is_validated: boolean;
  ClientProfile: ClientProfile;
  role_id: string;
  role: Role;
  category?: string;
  has_active_membership?: boolean;
  face_auth_enabled: boolean;
  client_membership?: ClientMembership;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type UserApiResponse = {
  user: User;
};

export type GetUserResponse = {
  birth_date: string;
  email: string;
  first_name: string;
  gender: string;
  identity_document: string;
  last_name: string;
  phone: string;
  profile_picture_url: string;
  role_id: string;
  role_name: string;
  user_id: string;
  category?: string;
  has_active_membership: boolean;
  is_validated: boolean;
  status: string;
};

export type UpdateUserRequest = {
  birth_date?: string;
  email?: string;
  first_name?: string;
  gender?: string;
  identity_document?: string;
  last_name?: string;
  phone?: string;
  profile_picture_url?: string;
};

export type UpdateUserStaffRequest = UpdateUserRequest & {
  role_name?: string;
};

export type UserPaginationOptions = {
  limit?: number;
  page?: number;
  sort?: 'asc' | 'desc';
  search?: string;
  role?: string;
};

export type QrToken = {
  token: string;
};

export type MedicalProfile = {
  allergies: string;
  blood_type: string;
  emergency_contact: string;
  medical_conditions: string;
  medical_risks: string;
  medications: string;
  warnings: string;
};

export type BlockUserRequest = {
  block_justification: string;
};

export type ClientBalance = {
  user_id: string;
  service_id: string;
  balance: number;
  updated_at: string;
  service?: ServiceFullDetail;
};
