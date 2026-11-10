import { z } from "zod";

export const branchServiceSchema = z.object({
  max_capacity: z
    .number()
    .min(1, "El aforo debe ser mayor a 0")
    .refine((val) => !isNaN(val), "Aforo debe ser un número válido"),
  price_for_member: z
    .number()
    .min(0, "El precio para miembros no puede ser negativo")
    .refine((val) => !isNaN(val), "Precio miembros debe ser un número válido"),
  price_for_non_member: z
    .number()
    .min(0, "El precio para no miembros no puede ser negativo")
    .refine(
      (val) => !isNaN(val),
      "Precio no miembros debe ser un número válido",
    ),
  is_visible: z.boolean(),
});
