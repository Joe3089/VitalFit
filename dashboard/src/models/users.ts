// En @/models/users.ts
export interface Users {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  document: string;
  date: string;
  gender: string;
  rol: "super_admin" | "branch_admin" | "accountant" | "data_analyst" | "instructor" | "recepcionist" | "client" | "staff";
  status: "active" | "inactive";
  uacceso: string;
}

export const roleLabels: Record<Users["rol"], string> = {
  super_admin: "Super Administrador",
  branch_admin: "Administrador de sede",
  accountant: "Contador",
  data_analyst: "Analista de Datos",
  instructor: "Instructor",
  recepcionist: "Recepcionista",
  client: "Cliente",
  staff: "Personal",
};

export interface BranchAdmin {
  id: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
}

export interface ApiBranchAdmin {
  user_id: string;
  first_name: string;
  last_name: string;
  role_id: string;
  role_name: string;
}

export interface ApiResponse {
  data: ApiBranchAdmin[];
}
