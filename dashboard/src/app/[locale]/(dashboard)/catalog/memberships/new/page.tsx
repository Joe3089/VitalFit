"use client";

import { useState } from "react";
import type { MembershipType } from "@vitalfit/sdk";
import type { CreateMembershipType } from "@vitalfit/sdk";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/sdk-config";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { createMembershipSchema } from "@/lib/validation/membershipSchema";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import MembershipForm from "@/components/modules/membership/MembershipForm";

type ValidationResult = {
  success: boolean;
  data: CreateMembershipType | null;
  errors: Partial<Record<keyof MembershipType, string>> | null;
};

type MembershipFormData = Omit<MembershipType, "duration_days" | "price"> & {
  duration_days: number | string;
  price: number | string;
};

export default function CreateMembership() {
  const t = useTranslations("catalog.memberships");
  const router = useRouter();
  const { token } = useAuth();

  const [formData, setFormData] = useState<MembershipFormData>({
    membership_type_id: "",
    name: "",
    description: "",
    duration_days: "",
    price: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof MembershipType, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof MembershipType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateMembership = (data: MembershipFormData): ValidationResult => {
    try {
      const schema = createMembershipSchema((key) =>
        t(`validations.${key.split(".").pop()}`)
      );

      const dataToValidate = {
        ...data,
        duration_days:
          data.duration_days === "" ? 0 : Number(data.duration_days),
        price: data.price === "" ? 0 : Number(data.price),
      };

      const validatedData = schema.parse(dataToValidate);
      return {
        success: true,
        data: validatedData,
        errors: null,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: Partial<Record<keyof MembershipType, string>> =
          {};

        error.issues.forEach((issue) => {
          const fieldName = issue.path[0] as keyof MembershipType;
          if (fieldName) {
            validationErrors[fieldName] = issue.message;
          }
        });

        return {
          success: false,
          data: null,
          errors: validationErrors,
        };
      }

      return {
        success: false,
        data: null,
        errors: {
          name: t("validations.validation_error"),
        },
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateMembership(formData);
    if (!validation.success) {
      setErrors(validation.errors || {});
      console.log("error al validar", validation.errors);
      return;
    }

    if (!validation.data) {
      setErrors({
        name: "Error de validación: datos inválidos",
      });
      return;
    }

    if (!token || typeof token !== "string" || token.length < 10) {
      toast.error(t("create.error_auth"));
      return;
    }

    const payload: CreateMembershipType = {
      name: validation.data.name,
      description: validation.data.description,
      duration_days: validation.data.duration_days,
      is_active: validation.data.is_active,
      price: validation.data.price,
    };

    setIsLoading(true);
    try {
      await api.membership.createMembershipType(payload, token);
      toast.success(t("create.success"));
      setTimeout(() => {
        router.push("/catalog/memberships");
      }, 1500);
    } catch (err: unknown) {
      console.error("Error al crear membresía:", err);

      if (err && typeof err === "object" && "response" in err) {
        const errorWithResponse = err as {
          response?: { data?: { error?: string } };
        };
        if (errorWithResponse.response?.data?.error) {
          toast.error(errorWithResponse.response.data.error);
        } else {
          toast.error(t("create.error_connection_description"));
        }
      } else {
        toast.error(t("create.error_connection_description"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded shadow">
      <form onSubmit={handleSubmit} className="space-y-2">
        <PageHeader title={t("create.title")}></PageHeader>
        <p className="text-sm text-muted-foreground">{t("create.subtitle")}</p>

        <MembershipForm
          formData={formData}
          onChange={handleChange}
          mode="edit"
          errors={errors}
        />
        <Button
          type="submit"
          className="w-full"
          variant="default"
          disabled={isLoading}
        >
          {isLoading ? t("create.button_saving") : t("create.button_create")}
        </Button>
      </form>
    </div>
  );
}
