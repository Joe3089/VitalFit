export type EquipmentCategory =
  | "Cardio"
  | "Strength"
  | "FreeWeight"
  | "Functional"
  | "Accessory";

export type Equipment = {
  equipment_id: string;
  name: string;
  category: EquipmentCategory;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
};
