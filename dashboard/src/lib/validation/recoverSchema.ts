import { z } from "zod";

export const createRecoverSchema = (t: (key: string) => string) =>
  z.object({
    usuario: z.string().email(t("emailInvalid")),
  });
