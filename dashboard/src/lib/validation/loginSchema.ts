import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
  password: z
    .string()
    .nonempty("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(20, "La contraseña no puede exceder los 20 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type LoginPayload = LoginFormData & {
  context: "dashboard";
};
