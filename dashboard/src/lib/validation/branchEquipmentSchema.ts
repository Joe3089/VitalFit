import { z } from "zod";

export const branchEquipmentSchema = z.object({
  equipment_id: z.string().min(1, "Debes seleccionar un equipo"),
  serial_number: z.string().min(1, "El número de serie es obligatorio"),
  notes: z.string().optional(),
  acquisition_date: z.string().min(1, "La fecha de adquisición es obligatoria"),
  last_maintenance_date: z
    .string()
    .min(1, "La fecha del último mantenimiento es obligatoria"),
  status: z.enum(["Available", "Maintenance", "Broken"]),
});
