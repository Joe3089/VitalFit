import { z } from "zod";

export const getActivateSchema = (t: any) => z.object({
  password: z
    .string()
    .min(8, { message: t("errors.password_min") })
    .regex(/[A-Z]/, { message: t("errors.password_uppercase") })
    .regex(/[a-z]/, { message: t("errors.password_lowercase") })
    .regex(/[0-9]/, { message: t("errors.password_number") })
    .regex(/[^A-Za-z0-9]/, { message: t("errors.password_special") }),
});