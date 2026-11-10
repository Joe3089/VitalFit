import { z } from "zod";

export const branchDetailsSchema = z.object({
  name: z.string().min(1, "Razón social es requerida"),
  tax_id: z.string().min(1, "RIF es requerido"),
  phone: z.string().min(1, "Teléfono es requerido"),
  address: z.string().min(1, "Dirección es requerida"),
  state: z.string().min(1, "Estado es requerido"),
  country: z.string().min(1, "País es requerido"),
  max_capacity: z.number().min(1, "Capacidad máxima debe ser mayor a 0"),
  manager: z.any().optional(),
});
