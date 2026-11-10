import { z } from "zod";

export const getClientSchema = (t: any) =>
    z.object({
        first_name: z.string().min(1, t("first_name_required")),
        last_name: z.string().min(1, t("last_name_required")),
        email: z
            .string()
            .email(t("email_invalid"))
            .min(1, t("email_required")),
        birth_date: z
            .string()
            .min(1, t("birth_date_required"))
            .refine((date) => {
                if (!date) return true;
                return new Date(date) <= new Date();
            }, t("birth_date_future")),
        gender: z.string().min(1, t("gender_required")),
        identity_document: z.string().min(1, t("identity_document_required")),
        phone: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
    });
