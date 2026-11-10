import { z } from "zod";

export const getLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t("validation.email.required") })
      .email({ message: t("validation.email.invalid") }),
    password: z
      .string()
      .min(1, { message: t("validation.password.required") })
      .min(8, { message: t("validation.password.min") })
      .max(20, { message: t("validation.password.max") }),
  });

// Legacy support
export const loginSchema = getLoginSchema((key: string) => {
  const messages: Record<string, string> = {
    "validation.email.required": "El correo electrónico es obligatorio",
    "validation.email.invalid": "Correo inválido",
    "validation.password.required": "La contraseña es obligatoria",
    "validation.password.min": "Debe tener al menos 8 caracteres",
    "validation.password.max": "No puede exceder 20 caracteres",
  };
  return messages[key] || key;
});
