import { z } from "zod";

type TranslationFn = (key: string, values?: any) => string;

export const getServiceSchema = (t: TranslationFn) =>
  z.object({
    name: z
      .string()
      .min(1, t("required"))
      .min(3, t("minChars", { min: 3 }))
      .max(100, t("maxChars", { max: 100 }))
      .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,;:()]+$/, t("invalidFormat")),

    description: z
      .string()
      .min(1, t("required"))
      .min(10, t("minChars", { min: 10 }))
      .max(500, t("maxChars", { max: 500 })),

    category_id: z
      .string()
      .min(1, t("required"))
      .uuid(t("invalidUuid")),

    duration: z
      .string()
      .min(1, t("required"))
      .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
        message: t("positiveNumber"),
      }),

    priority: z
      .string()
      .min(1, t("required"))
      .refine((val) => ["1", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100"].includes(val), {
        message: t("invalidSelection"),
      }),

    is_featured: z
      .string()
      .min(1, t("required"))
      .refine((val) => ["true", "false"].includes(val), {
        message: t("invalidSelection"),
      }),

    banner_id: z
      .string()
      .min(1, t("required"))
      .uuid(t("invalidUuid")),
  });

export type ServiceFormData = z.infer<ReturnType<typeof getServiceSchema>>;