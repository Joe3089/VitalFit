export enum UserRole {
  SUPER_ADMIN = "super_admin",
  BRANCH_ADMIN = "branch_admin",
  INSTRUCTOR = "instructor",
  ACCOUNTANT = "accountant",
  DATA_ANALYST = "data_analyst",
  RECEPTIONIST = "recepcionist", // Nota: Mantenemos "recepcionist" como lo tienes en tu BD actual
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Administrador",
  [UserRole.BRANCH_ADMIN]: "Administrador de Sede",
  [UserRole.INSTRUCTOR]: "Instructor",
  [UserRole.ACCOUNTANT]: "Contador",
  [UserRole.DATA_ANALYST]: "Analista de Datos",
  [UserRole.RECEPTIONIST]: "Recepcionista",
};

export const CAN_MANAGE_FINANCE = [UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT];
export const CAN_MANAGE_USERS = [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN];