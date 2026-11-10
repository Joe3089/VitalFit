import type { PaginationRequest } from './utils';

export type EquipmentCategory =
  | 'Cardio'
  | 'Strength'
  | 'FreeWeight'
  | 'Functional'
  | 'Accessory';

export type Equipment = {
  equipment_id: string;
  name: string;
  brand: string;
  model: string;
  category: EquipmentCategory;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateEquipment = Omit<
  Equipment,
  'equipment_id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export type UpdateEquipment = Partial<CreateEquipment>;

export type EquipmentStatus = 'Available' | 'InMaintenance' | 'OutOfService';

export type CreateBranchEquipment = {
  acquisition_date: string;
  equipment_id: string;
  last_maintenance_date: string;
  notes: string;
  serial_number: string;
  status: EquipmentStatus;
};

export type UpdateBranchEquipmentDetails = {
  last_maintenance_date?: string;
  notes?: string;
  status?: EquipmentStatus;
};

export type EquipmentInfo = {
  equipment_id: string;
  name: string;
  category: EquipmentCategory;
  model: string;
  description: string;
};

export type BranchEquipmentInventory = {
  acquisition_date: string;
  equipment_id: string;
  name: string;
  inventory_id: string;
  last_maintenance_date: string;
  notes: string;
  serial_number: string;
  status: EquipmentStatus;
};

export type PaginatedEquipmentRequest = PaginationRequest & {
  category?: EquipmentCategory;
};
