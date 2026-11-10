import { z } from "zod";

export const createPasswordSchema = (t: (key: string) => string) =>
  z.object({
    password: z
      .string()
      .min(1, { message: t("passwordRequired") })
      .min(8, { message: t("passwordMinLength") })
      .regex(/[A-Z]/, {
        message: t("passwordUppercase"),
      })
      .regex(/[a-z]/, {
        message: t("passwordLowercase"),
      })
      .regex(/[0-9]/, {
        message: t("passwordNumber"),
      }),

    confirmPassword: z
      .string()
      .min(1, { message: t("confirmPasswordRequired") }),
  })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMustMatch"),
      path: ["confirmPassword"],
    });