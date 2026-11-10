import { z } from "zod";

export const getPaymentMethodSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("validations.name_required"))
      .max(100, t("validations.name_max"))
      .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$/, t("validations.name_format")),

    type: z.string().min(1, t("validations.type_required")),

    processing_type: z
      .string()
      .min(1, t("validations.processing_type_required")),

    description: z.string().max(500, t("validations.description_max")).optional(),
  });

export type PaymentMethodFormData = {
  name: string;
  type: string;
  processing_type: string;
  description?: string;
};
