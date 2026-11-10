import { z } from "zod";

export const getRoleSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .trim() 
      .min(1, { message: t("validations.name_required") })
      .max(50, { message: t("validations.name_max") }),

    description: z
      .string()
      .trim()
      .min(1, { message: t("validations.description_required") })
      .max(200, { message: t("validations.description_max") }),

    permissionsID: z
      .array(z.string())
      .min(1, { message: t("validations.permissions_min") }),
  });

export type RoleFormData = z.infer<ReturnType<typeof getRoleSchema>>;

export const validateRole = (data: unknown, t: (key: string) => string) => {
  return getRoleSchema(t).safeParse(data);
};

export const validateRoleField = <K extends keyof RoleFormData>(
  field: K,
  value: RoleFormData[K],
  t: (key: string) => string,
) => {
  const schema = getRoleSchema(t).pick({ [field]: true } as Record<K, true>);
  const result = schema.safeParse({ [field]: value });

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Error de validación",
    };
  }

  return { success: true, error: undefined };
};