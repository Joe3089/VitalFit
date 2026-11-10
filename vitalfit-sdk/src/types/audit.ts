export type AuditLog = {
  created_at: string;
  id: number;
  ip_address: string;
  method: string;
  path: string;
  payload: string;
  status: number;
  user_agent: string;
  user_id: string;
};
