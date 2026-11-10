import { z } from "zod";

export interface ScheduleClassFormData {
  branch_id: string;
  service_id: string;
  instructor_id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  end_date?: string;
  max_capacity: number;
  is_visible: boolean;
  notes?: string;
  recurrence: "none" | "daily" | "weekly";
  recurrence_until?: string | null;
}

export const getScheduleClassSchema = (t: any) =>
  z.object({
    branch_id: z.string().min(1, t("errors.branch_required")),
    service_id: z.string().min(1, t("errors.service_required")),
    instructor_id: z.string().min(1, t("errors.instructor_required")),
    start_date: z.string().min(1, t("errors.date_required")),
    start_time: z.string().min(1, t("errors.start_time_required")),
    end_time: z.string().min(1, t("errors.end_time_required")),
    max_capacity: z.number().min(1, t("errors.capacity_min")),
    is_visible: z.boolean().default(true),
    notes: z.string().optional(),
    recurrence: z.enum(["none", "daily", "weekly"]).default("none"),
    recurrence_until: z.string().nullable().optional(),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: t("errors.end_time_after"),
    path: ["end_time"],
  })
  .refine((data) => {
    if (data.recurrence !== "none") {
      return !!data.recurrence_until && data.recurrence_until > data.start_date;
    }
    return true;
  }, {
    message: t("errors.recurrence_until_after"),
    path: ["recurrence_until"],
  });