import { z } from "zod";

const horarioSchema = z.object({
  apertura: z.string().min(1, "La hora de apertura es obligatoria"),
  cierre: z.string().min(1, "La hora de cierre es obligatoria"),
  cerrado: z.boolean(),
});

export const branchSchema = z.object({
  razonSocial: z.string().min(1, "La razón social es obligatoria"),
  rif: z.string().min(1, "El RIF es obligatorio"),
  ciudad: z.string().min(1, "La ciudad es obligatoria"),
  estadoSucursal: z.string().min(1, "El estado de la sucursal es obligatorio"),
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  direccion: z.string().min(1, "La dirección es obligatoria"),
  latitud: z.string().min(1, "La latitud es obligatoria"),
  longitud: z.string().min(1, "La longitud es obligatoria"),
  gerenteResponsable: z
    .string()
    .min(1, "El gerente responsable es obligatorio"),
  capacidadMiembros: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "La capacidad debe ser un número mayor a 0",
    }),
  horarios: z.record(z.string(), horarioSchema),
  metodosPago: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos un método de pago"),
});

export const step1Schema = z.object({
  razonSocial: z.string().min(1, "La razón social es obligatoria"),
  rif: z.string().min(1, "El RIF es obligatorio"),
  ciudad: z.string().min(1, "La ciudad es obligatoria"),
  estadoSucursal: z.string().min(1, "El estado de la sucursal es obligatorio"),
  telefono: z.string().min(1, "El telfono es obligatorio"),
  direccion: z.string().min(1, "La direcci\u00f3n es obligatoria"),
});

export const step2Schema = z.object({
  latitud: z.string().min(1, "La latitud es obligatoria"),
  longitud: z.string().min(1, "La longitud es obligatoria"),
});

export const step3Schema = z.object({
  gerenteResponsable: z
    .string()
    .min(1, "El gerente responsable es obligatorio"),
  capacidadMiembros: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "La capacidad debe ser un número mayor a 0",
    }),
  horarios: z.record(
    z.string(),
    z.object({
      apertura: z.string().min(1, "La hora de apertura es obligatoria"),
      cierre: z.string().min(1, "La hora de cierre es obligatoria"),
      cerrado: z.boolean(),
    }),
  ),
});

export const step4Schema = z.object({
  metodosPago: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos un método de pago"),
});
