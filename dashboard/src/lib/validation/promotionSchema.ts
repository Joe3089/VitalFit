import * as z from "zod";

export const promotionSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  code: z
    .string()
    .min(4, "El código debe tener al menos 4 caracteres")
    .regex(/^[a-zA-Z0-9]+$/, "Solo letras y números, sin espacios"),
  discount_type: z.enum(["Percentage", "Fixed"]), 
  discount_value: z.number().min(1, "El valor debe ser mayor a 0"),
  start_date: z.string().min(1, "Fecha de inicio requerida"),
  end_date: z.string().min(1, "Fecha de finalización requerida"),
  is_active: z.boolean().default(true),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["end_date"],
});