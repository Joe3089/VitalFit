"use client";

import { useState, useEffect } from "react";
import type { UpdateMembershipType } from "@vitalfit/sdk";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { MembershipType } from "@vitalfit/sdk";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createMembershipSchema } from "@/lib/validation/membershipSchema";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import MembershipForm from "@/components/modules/membership/MembershipForm";

export default function EditMembership() {
  const t = useTranslations("catalog.memberships");
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const id = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MembershipType, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<MembershipType>({
    membership_type_id: "",
    name: "",
    description: "",
    duration_days: 0,
    is_active: true,
    price: 0,
  });

  useEffect(() => {
    if (!id) {
      router.replace("/catalog/memberships");
      return;
    }
    if (!token) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const membershipData = await api.membership.getMembershipTypeByID(
          id,
          token
        );
        if (!mounted) {
          return;
        }
        setMembership(membershipData.data);
      } catch (err: any) {
        if (!mounted) {
          return;
        }
        const status = err?.response?.status ?? err?.status ?? null;
        if (status === 404) {
          router.replace("/catalog/memberships");
        } else {
          console.error("Error cargando membresia:", err);
          setError(t("edit.error_load"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, token, router]);

  useEffect(() => {
    if (membership) {
      setFormData({
        membership_type_id: membership.membership_type_id,
        name: membership.name ?? "",
        description: membership.description ?? "",
        duration_days: membership.duration_days ?? "",
        is_active: membership.is_active ?? true,
        price: membership.price ?? 0,
      });
    }
  }, [membership]);

  const handleChange = (field: keyof MembershipType, value: string) => {
    let newValue: string | boolean = value;
    if (field === "is_active") {
      newValue = value === "true";
    }

    setFormData((prev) => ({ ...prev, [field]: newValue }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (
    formData: MembershipType,
    setErrors: (errors: Partial<Record<keyof MembershipType, string>>) => void
  ) => {
    const schema = createMembershipSchema((key) =>
      t(`validations.${key.split(".").pop()}`)
    );
    const result = schema.safeParse(formData);

    if (!result.success) {
      const zodErrors = result.error.flatten().fieldErrors;

      const formattedErrors = Object.entries(zodErrors).reduce(
        (acc, [key, messages]) => {
          if (messages && messages.length > 0) {
            acc[key as keyof MembershipType] = messages[0];
          }
          return acc;
        },
        {} as Partial<Record<keyof MembershipType, string>>
      );

      setErrors(formattedErrors);
      return null;
    }

    setErrors({});
    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validatedData = validate(formData, setErrors);
    if (!validatedData) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token || typeof token !== "string" || token.length < 10) {
      toast.error(t("edit.error_auth"));
      return;
    }

    const payload: UpdateMembershipType = {
      name: validatedData.name,
      description: validatedData.description,
      duration_days: validatedData.duration_days,
      is_active: validatedData.is_active,
      price: validatedData.price,
    };

    setIsLoading(true);
    try {
      await api.membership.updateMembershipType(
        formData.membership_type_id,
        payload,
        token
      );
      toast.success(t("edit.success"));
      setTimeout(() => router.replace("/catalog/memberships"), 1500);
    } catch (err: any) {
      console.error("Error al actualizar membresia:", err);
      if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(t("edit.error_connection_description"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded shadow">
      <form onSubmit={handleSubmit} className="space-y-2">
        <PageHeader title={t("edit.title")}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.replace("/catalog/memberships")}
          >
            {t("edit.button_cancel")}
          </Button>
          <Button type="submit" variant="default" disabled={isLoading}>
            {isLoading ? t("edit.button_saving") : t("edit.button_save")}
          </Button>
        </PageHeader>
        <p className="text-sm text-muted-foreground">
          {t("edit.subtitle", { name: membership?.name || "" })}
        </p>

        {!loading && (
          <MembershipForm
            formData={formData}
            onChange={handleChange}
            mode="edit"
            errors={errors}
          />
        )}
      </form>
    </div>
  );
}
