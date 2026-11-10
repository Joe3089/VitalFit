import { z } from "zod";

export const equipmentSchema = z.object({
  equipment_id: z.string().optional(),

  name: z.string().min(1, "form.errors.name_required"),
  description: z.string().min(1, "form.errors.description_required"),
  brand: z.string().min(1, "form.errors.brand_required"),
  model: z.string().min(1, "form.errors.model_required"),


  category: z.enum([
    "Cardio",
    "Strength",
    "FreeWeight",
    "Functional",
    "Accessory",
  ], "form.errors.category_required"), 
});

export type EquipmentSchema = z.infer<typeof equipmentSchema>;