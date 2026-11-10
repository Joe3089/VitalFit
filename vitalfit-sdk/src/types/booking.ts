export type ClientBookingResponse = {
  booking_id: string;
  branch_name: string;
  class_id: string;
  ends_at: string;
  instructor: string;
  service_name: string;
  starts_at: string;
};

export type BranchScheduleResponse = {
  branch_id: string;
  class_id: string;
  created_at: string;
  ends_at: string;
  instructor_id: string;
  is_visible: boolean;
  max_capacity: number;
  notes: string;
  service_id: string;
  starts_at: string;
  updated_at: string;
};

export type BookClassRequest = {
  user_id: string;
};

export type ClassBookingCount = {
  count: number;
};

export type BookingParticipant = {
  booking_id: string;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  user_id: string;
};
