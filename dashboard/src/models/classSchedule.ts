import { BranchClassInfo } from "@vitalfit/sdk";

export interface GetClassResponse {
  data: BranchClassInfo;
}

export interface UpdateClassPayload {
  starts_at: string;
  ends_at: string;
  instructor_id: string;
  service_id: string;
  is_visible: boolean;
  max_capacity: number;
  notes: string;
}