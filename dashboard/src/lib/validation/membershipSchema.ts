import { z } from "zod";

export const createMembershipSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("catalog.memberships.validations.name_required"))
      .max(100, t("catalog.memberships.validations.name_max")),

    description: z
      .string()
      .min(1, t("catalog.memberships.validations.description_required"))
      .max(500, t("catalog.memberships.validations.description_max")),

    duration_days: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) {
          return 0;
        }
        const num = Number(val);
        return isNaN(num) ? 0 : Math.max(0, num);
      })
      .pipe(
        z
          .number()
          .int(t("catalog.memberships.validations.duration_int"))
          .min(1, t("catalog.memberships.validations.duration_min"))
          .max(3650, t("catalog.memberships.validations.duration_max")),
      ),

    price: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === "" || val === null || val === undefined) {
          return 0;
        }
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      })
      .pipe(
        z
          .number()
          .min(1, t("catalog.memberships.validations.price_min"))
          .max(999999.99, t("catalog.memberships.validations.price_max")),
      ),

    is_active: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          return val === "true";
        }
        return Boolean(val);
      })
      .pipe(z.boolean()),
  });

// Export legacy schema for backward compatibility
export const membershipSchema = createMembershipSchema((key) => {
  // Legacy Spanish translations
  const translations: Record<string, string> = {
    "catalog.memberships.validations.name_required": "El nombre es requerido",
    "catalog.memberships.validations.name_max":
      "El nombre no puede tener más de 100 caracteres",
    "catalog.memberships.validations.description_required":
      "La descripción es requerida",
    "catalog.memberships.validations.description_max":
      "La descripción no puede tener más de 500 caracteres",
    "catalog.memberships.validations.duration_int":
      "La duración debe ser un número entero",
    "catalog.memberships.validations.duration_min":
      "La duración no puede ser cero (0) o negativa",
    "catalog.memberships.validations.duration_max":
      "La duración máxima es 3650 días (10 años)",
    "catalog.memberships.validations.price_min":
      "El precio no puede cero (0) o negativo",
    "catalog.memberships.validations.price_max":
      "El precio máximo es 999,999.99",
  };
  return translations[key] || key;
});

export type MembershipFormData = z.infer<typeof membershipSchema>;
