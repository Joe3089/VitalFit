import type { PaginationRequest } from './utils';
import type { UserGender } from './auth';

export type Specialty = {
  specialty_id: string;
  specialty_name?: string;
};

export type InstructorData = {
  biography: string;
  birth_date: string;
  email: string;
  first_name: string;
  gender: string;
  identity_document: string;
  instructor_id: string;
  last_name: string;
  phone: string;
  profile_picture_url: string;
  specialties: Specialty[];
  user_id: string;
};

export type InstructorDataList = {
  biography: string;
  birth_date: string;
  email: string;
  first_name: string;
  gender: string;
  identity_document: string;
  instructor_id: string;
  last_name: string;
  phone: string;
  profile_picture_url: string;
  user_id: string;
};

export type Instructor = {
  biography?: string;
  birth_date?: string;
  email?: string;
  first_name?: string;
  gender?: UserGender | null;
  identity_document?: string;
  last_name?: string;
  phone?: string;
  profile_picture_url?: string;
};

export type PaginatedInstructor = PaginationRequest & {
  identity_doc?: string;
};

export type BranchInstructorInfo = {
  email: string;
  instructorName: string;
  phone: string;
  instructorID: string;
};

export type InstructorsSummary = {
  total: number;
  actives: number;
  blocked: number;
};

export type AssignedClientResponse = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_bookings: number;
  profile_picture_url: string;
};
