import { z } from "zod";

export const getRecoverSchema = (t: (key: string) => string) =>
  z.object({
    usuario: z
      .string()
      .min(1, { message: t("validation.usuario.required") })
      .email({ message: t("validation.usuario.invalid") }),
  });

// Legacy support
export const recoverSchema = getRecoverSchema((key: string) => {
  const messages: Record<string, string> = {
    "validation.usuario.required": "El correo electrónico es obligatorio",
    "validation.usuario.invalid": "Correo inválido",
  };
  return messages[key] || key;
});
