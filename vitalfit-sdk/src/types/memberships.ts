export type MembershipType = {
  description: string;
  duration_days: number;
  is_active: boolean;
  membership_type_id: string;
  name: string;
  price: number;
};

export type CreateMembershipType = {
  description: string;
  duration_days: number;
  is_active: boolean;
  name: string;
  price: number;
};

export type UpdateMembershipType = {
  description?: string;
  duration_days?: number;
  is_active?: boolean;
  name?: string;
  price?: number;
};

export type MembershipsSummary = {
  total: number;
  actives: number;
  inactives: number;
};

export type PublicMembershipResponse = {
  membership_type_id: string;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  base_currency: string;
  ref_price: string;
  ref_currency: string;
  is_active: boolean;
};

export type ClientMembershipUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type MembershipTypeDetail = MembershipType & {
  created_at: string;
  updated_at: string;
};

export type ClientMembershipItem = {
  client_membership_id: string;
  user_id: string;
  membership_type_id: string;
  start_date: string;
  end_date: string;
  status: string;
  invoice_id: string;

  cancellation_reason_id?: string;
  cancellation_notes?: string;

  user: ClientMembershipUser;
  membership_type: MembershipTypeDetail;
};

export type CancellationReason = {
  reason_id: string;
  description: string;
  is_active: boolean;
};

export type CreateCancellationReason = {
  description: string;
  is_active: boolean;
};

export type ClientMembershipDetail = ClientMembershipItem & {
  cancellation_reason?: CancellationReason;
};

export type UpdateClientMembershipRequest = {
  status?: string;
  cancel_notes?: string;
  cancel_reason_id?: string;
};
