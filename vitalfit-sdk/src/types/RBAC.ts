export interface Permission {
  created_at?: string;
  description?: string;
  name?: string;
  permission_id: string;
  updated_at?: string;
}

export interface RoleResponse {
  created_at: string;
  description: string;
  name: string;
  permissions: Permission[];
  role_id: string;
  updated_at: string;
}

export type CreateRole = {
  description: string;
  name: string;
  permissions: string[];
};
