import { z } from "zod";

export const getRegisterSchema = (t: (key: string) => string) =>
  z
    .object({
      nombre: z
        .string()
        .min(1, { message: t("validation.firstName.required") })
        .min(2, { message: t("validation.firstName.min") })
        .max(50, { message: t("validation.firstName.max") }),

      apellido: z
        .string()
        .min(1, { message: t("validation.lastName.required") })
        .min(2, { message: t("validation.lastName.min") })
        .max(50, { message: t("validation.lastName.max") }),

      email: z
        .string()
        .min(1, { message: t("validation.email.required") })
        .email({ message: t("validation.email.invalid") }),

      telefono: z
        .string()
        .min(1, { message: t("validation.phone.required") })
        .regex(/^\+?[\d\s\-()]+$/, {
          message: t("validation.phone.invalid"),
        })
        .refine(
          (val) => {
            const digits = val.replace(/\D/g, "");
            return digits.length >= 7;
          },
          { message: t("validation.phone.minDigits") },
        ),

      documento: z
        .string()
        .min(1, { message: t("validation.document.required") })
        .min(3, { message: t("validation.document.min") }),

      genero: z
        .union([
          z.literal("male"),
          z.literal("female"),
          z.literal("prefer-not-to-say"),
          z.literal(""),
        ])
        .refine((val) => val !== "", {
          message: t("validation.gender.required"),
        }),

      nacimiento: z
        .string()
        .min(1, { message: t("validation.birthDate.required") })
        .refine(
          (date) => {
            const birthDate = new Date(date);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              return age - 1 >= 12;
            }
            return age >= 12;
          },
          { message: t("validation.birthDate.minAge") },
        ),

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

      cpassword: z
        .string()
        .min(1, { message: t("validation.confirmPassword.required") }),
    })
    .refine((data) => data.password === data.cpassword, {
      message: t("validation.confirmPassword.mismatch"),
      path: ["cpassword"],
    });

// Un esquema por defecto para tipos e inferencia si se necesita
const baseSchema = z.object({
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  telefono: z.string(),
  documento: z.string(),
  genero: z.string(),
  nacimiento: z.string(),
  password: z.string(),
  cpassword: z.string(),
});

export type RegisterFormData = z.infer<typeof baseSchema> & {
  terms?: boolean;
};

// Mantenemos registerSchema para compatibilidad, pero lo ideal es usar getRegisterSchema(t)
export const registerSchema = getRegisterSchema((key: string) => {
  // Mapa de mensajes por defecto en español si no se provee traductor
  const messages: Record<string, string> = {
    "validation.firstName.required": "El nombre es obligatorio",
    "validation.firstName.min": "El nombre debe tener al menos 2 caracteres",
    "validation.firstName.max": "El nombre no puede exceder los 50 caracteres",
    "validation.lastName.required": "El apellido es obligatorio",
    "validation.lastName.min": "El apellido debe tener al menos 2 caracteres",
    "validation.lastName.max": "El apellido no puede exceder los 50 caracteres",
    "validation.email.required": "El correo electrónico es obligatorio",
    "validation.email.invalid": "Debe ser un correo electrónico válido",
    "validation.phone.required": "El teléfono es obligatorio",
    "validation.phone.invalid": "Formato de teléfono inválido",
    "validation.phone.minDigits": "El teléfono debe tener al menos 7 dígitos",
    "validation.document.required": "El documento de identidad es obligatorio",
    "validation.document.min": "El documento debe tener al menos 3 caracteres",
    "validation.gender.required": "Selecciona un género válido",
    "validation.birthDate.required": "La fecha de nacimiento es obligatoria",
    "validation.birthDate.minAge": "Debes ser mayor de 12 años",
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
