export type ClassStatus = 'Scheduled' | 'Cancelled';

export type BranchClassInfo = {
  branch_id: string;
  class_id: string;
  ends_at: string;
  instructor_id: string;
  is_visible: boolean;
  max_capacity: number;
  notes: string;
  service_id: string;
  starts_at: string;
  status?: ClassStatus;
  cancellation_reason?: string;
  cancelled_at?: string;
};

export type CancelClassResponse = {
  message: string;
  affected_bookings: number;
};

export type CreateClassPayload = {
  ends_at: string;
  instructor_id: string;
  is_visible: boolean;
  max_capacity: number;
  notes: string;
  recurrence?: 'daily' | 'weekly' | 'none';
  recurrence_until?: string;
  service_id: string;
  starts_at: string;
};

export type UpdateClassPayload = {
  ends_at: string;
  instructor_id: string;
  is_visible: boolean;
  max_capacity: number;
  notes: string;
  service_id: string;
  starts_at: string;
};
