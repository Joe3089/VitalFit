import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().min(1, "form.errors.name_required"),
  description: z.string().min(1, "form.errors.description_required"),
  price: z.number().min(0.01, "form.errors.price_min"),
  startAt: z.string().min(1, "form.errors.start_date_required"),
  endAt: z.string().min(1, "form.errors.end_date_required"),
  packageItems: z.array(
    z.object({
      serviceId: z.string(),
      sessionsIncluded: z.number().min(1, "form.errors.sessions_min"),
    })
  ).min(1, "form.errors.at_least_one_service"),
}).refine((data) => {
  return new Date(data.endAt) > new Date(data.startAt);
}, {
  message: "form.errors.invalid_date_range",
  path: ["endAt"],
});

export type PackageFormData = z.infer<typeof packageSchema>;