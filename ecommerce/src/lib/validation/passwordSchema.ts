import { z } from "zod";

export const getPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      password: z
        .string()
        .min(1, { message: t("validation.password.required") })
        .min(8, { message: t("validation.password.min") })
        .regex(/[A-Z]/, {
          message: t("validation.password.uppercase"),
        })
        .regex(/[a-z]/, {
          message: t("validation.password.lowercase"),
        })
        .regex(/[0-9]/, {
          message: t("validation.password.number"),
        })
        .regex(/[^a-zA-Z0-9.]/, {
          message: t("validation.password.special"),
        })
        .regex(/^[^.]+$/, {
          message: t("validation.password.noDot"),
        }),

      confirmPassword: z
        .string()
        .min(1, { message: t("validation.confirmPassword.required") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.confirmPassword.mismatch"),
      path: ["confirmPassword"],
    });

// Legacy support
export const passwordSchema = getPasswordSchema((key: string) => {
  const messages: Record<string, string> = {
    "validation.password.required": "La contraseña es obligatoria",
    "validation.password.min": "La contraseña debe tener al menos 8 caracteres",
    "validation.password.uppercase":
      "La contraseña debe contener al menos una mayúscula",
    "validation.password.lowercase":
      "La contraseña debe contener al menos una minúscula",
    "validation.password.number":
      "La contraseña debe contener al menos un número",
    "validation.password.special":
      "La contraseña debe contener al menos un carácter especial",
    "validation.password.noDot":
      "La contraseña no puede contener el símbolo de punto",
    "validation.confirmPassword.required":
      "Confirmar contraseña es obligatorio",
    "validation.confirmPassword.mismatch": "Las contraseñas no coinciden",
  };
  return messages[key] || key;
});
