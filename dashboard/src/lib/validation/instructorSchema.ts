import { z } from "zod";


const genderEnum = ["male", "female", "prefer-not-to-say"] as const;

export const getInstructorSchema = (t: any) => 
  z.object({
    first_name: z
      .string()
      .min(1, { message: t("errors.first_name_required") })
      .max(50, { message: t("errors.first_name_max") })
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
        message: t("errors.first_name_invalid"),
      }),

    last_name: z
      .string()
      .min(1, { message: t("errors.last_name_required") })
      .max(50, { message: t("errors.last_name_max") })
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
        message: t("errors.last_name_invalid"),
      }),

    email: z
      .string()
      .min(1, { message: t("errors.email_required") })
      .email({ message: t("errors.email_invalid") })
      .max(100, { message: t("errors.email_max") }),

    identity_document: z
      .string()
      .min(1, { message: t("errors.document_required") })
      .max(20, { message: t("errors.document_max") }),

    phone: z
      .string()
      .min(1, { message: t("errors.phone_required") })
      .max(20, { message: t("errors.phone_max") }),

    birth_date: z
      .string()
      .min(1, { message: t("errors.birth_date_required") })
      .refine(
        (date) => {
          const birthDate = new Date(date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age >= 18;
        },
        { message: t("errors.birth_date_age") }
      )
      .refine(
        (date) => new Date(date) <= new Date(),
        { message: t("errors.birth_date_future") }
      ),

    gender: z
      .string()
      .min(1, { message: t("errors.gender_required") })
      .refine(
        (value) => genderEnum.includes(value as any),
        { message: t("errors.gender_invalid") }
      ),

    biography: z
      .string()
      .max(500, { message: t("errors.biography_max") })
      .optional()
      .or(z.literal("")),

    profile_picture_url: z
      .string()
      .url({ message: t("errors.url_invalid") })
      .optional()
      .or(z.literal("")),
  });


export type InstructorFormData = z.infer<ReturnType<typeof getInstructorSchema>>;
export type GenderEnum = (typeof genderEnum)[number];


export const validateInstructor = (data: any, t: any) => {
  return getInstructorSchema(t).safeParse(data);
};

export const validateInstructorField = (field: string, value: any, t: any) => {
  try {
    const schema = getInstructorSchema(t);

    schema.pick({ [field]: true }).parse({ [field]: value });
    return { success: true, error: undefined };
  } catch (error: any) {
    return {
      success: false,
      error: error.issues?.[0]?.message || "Error",
    };
  }
};