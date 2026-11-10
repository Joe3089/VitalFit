// app/lib/validation/class.ts
import { z } from "zod";

export const ClassFormSchema = z
  .object({
    // Identificadores (Requeridos)
    service_id: z.string().min(1, "El servicio es requerido"),
    branch_id: z.string().min(1, "La sucursal es requerida"),
    instructor_id: z.string().min(1, "El instructor es requerido"),
    
    // Configuración (Capacidad como número o string que se transforma)
    max_capacity: z.union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => val > 0, "La capacidad debe ser mayor a 0"),
    
    // Visibilidad y Notas
    is_visible: z.boolean().default(true),
    notes: z.string().optional().default(""),

    // Manejo de Fechas (Campos de UI)
    start_date: z.string().min(1, "La fecha de inicio es requerida"),
    start_time: z.string().min(1, "La hora de inicio es requerida"),
    end_date: z.string().min(1, "La fecha de fin es requerida"),
    end_time: z.string().min(1, "La hora de fin es requerida"),
  })
  .refine(
    (data) => {
      // Validamos que la fecha completa de fin sea mayor a la de inicio
      const start = new Date(`${data.start_date}T${data.start_time}`);
      const end = new Date(`${data.end_date}T${data.end_time}`);
      return end > start;
    },
    {
      message: "La finalización debe ser posterior al inicio",
      path: ["end_time"], // Resalta el error en el input de la hora de fin
    }
  );

export type ClassFormData = z.infer<typeof ClassFormSchema>;