import { z } from "zod";

export const fiscalDocumentSchema = z.object({
  name: z
    .string()
    .min(3, "errors.name_min")
    .max(50, "errors.name_max"),
  prefix: z
    .string()
    .min(1, "errors.prefix_required")
    .max(10, "errors.prefix_max")
    .regex(/^[a-zA-Z0-9-]+$/, "errors.prefix_invalid"),
});

export type FiscalDocumentSchema = z.infer<typeof fiscalDocumentSchema>;