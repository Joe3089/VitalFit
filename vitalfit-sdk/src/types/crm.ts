export type FeedbackType = 'complaint' | 'suggestion' | 'compliment';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type ClientFeedback = {
  feedback_id: string;
  user_id: string;
  branch_id: string | null;
  type: FeedbackType;
  subject: string;
  description: string;
  status: FeedbackStatus;
  resolution_notes: string;
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
  branch_name?: string;
};

export type CreateFeedbackRequest = {
  user_id?: string;
  branch_id?: string;
  type: FeedbackType;
  subject: string;
  description: string;
};

export type UpdateFeedbackRequest = {
  status: FeedbackStatus;
  resolution_notes?: string;
};

export type FeedbackFilter = {
  status?: FeedbackStatus;
  type?: FeedbackType;
  user_id?: string;
  branch_id?: string;
  page?: number;
  limit?: number;
};

export type PagedResponse<T> = {
  data: T;
  total: number;
  page: number;
  limit: number;
};

export type ClientTag = {
  tag_id: string;
  name: string;
  color: string;
  created_at: string;
  client_count?: number;
};

export type ClientCategory = 'VIP' | 'Regular' | 'New' | 'AtRisk';

export type SegmentCount = {
  category: ClientCategory;
  total: number;
};

export type ClientScoreBreakdown = {
  user_id: string;
  score: number;
  frequency_score: number;
  punctuality_score: number;
  referral_score: number;
  visits_90d: number;
  invoices_total: number;
  invoices_on_time: number;
  category: ClientCategory;
  scoring_weight_note: string;
};

export type NPSRequest = {
  score: number;
  comment?: string;
  branch_id?: string;
  channel?: 'web' | 'mobile' | 'dashboard';
};

export type ContactMessageStatus = 'new' | 'read' | 'answered';

export type ContactRequest = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  branch_id?: string;
};

export type ContactMessage = ContactRequest & {
  message_id: string;
  status: ContactMessageStatus;
  created_at: string;
};
