import { z } from "zod";

export const getActivateSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t("validation.email.required") })
      .email({ message: t("validation.email.invalid") }),
  });
