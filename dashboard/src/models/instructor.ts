import { UserGender } from "@vitalfit/sdk";
export type Instructor = {
  instructor_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: UserGender;
  identity_document: string;
  biography?: string;
  profile_picture_url: string;
  specialties?: [];
};
