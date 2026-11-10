"use client";

import { useState } from "react";
import { Equipment } from "@/models/equipment";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import EquipmentForm from "../EquipmentForm";
import { api } from "@/lib/sdk-config";
import type { CreateEquipment } from "@vitalfit/sdk";
import { type EquipmentSchema } from "@/lib/validation/equipmentSchema";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CreateEquipmentProps {
  onBack: () => void;
}

export default function CreateEquipment({ onBack }: CreateEquipmentProps) {
  const t = useTranslations("catalog.equipment.create");
  const tFormErrors = useTranslations("catalog.equipment.form.errors");
  const [formData, setFormData] = useState<EquipmentSchema>({
    name: "",
    description: "",
    brand: "",
    model: "",
    category: "Cardio",
  });

  const router = useRouter();

  const [errors, setErrors] = useState<
    Partial<Record<keyof Equipment, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof Equipment, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof Equipment, string>> = {};

    if (!(formData.name ?? "").trim()) {
      newErrors.name = tFormErrors("name_required");
    }
    if (!(formData.description ?? "").trim()) {
      newErrors.description = tFormErrors("description_required");
    }
    if (!(formData.brand ?? "").trim()) {
      newErrors.brand = tFormErrors("brand_required");
    }
    if (!(formData.model ?? "").trim()) {
      newErrors.model = tFormErrors("model_required");
    }
    if (!(formData.category ?? "").trim()) {
      newErrors.category = tFormErrors("category_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token || typeof token !== "string" || token.length < 10) {
      toast.error(t("server_error_title"), { description: "Token not found" });
      return;
    }

    const payload: CreateEquipment = {
      name: formData.name,
      description: formData.description ?? "",
      brand: formData.brand ?? "",
      model: formData.model ?? "",
      category: formData.category,
    };

    setIsLoading(true);
    try {
      await api.equipment.createEquipment(payload, token);
      toast.success(t("success"));
      setTimeout(() => {
        router.replace("/catalog/equipment");
      }, 1500);
    } catch (err: any) {
      console.error("Error al crear equipo:", err);
      if (err?.response?.data?.error) {
        toast.error(t("server_error_title"), { description: err.response.data.error });
      } else {
        toast.error(t("connection_error_title"), { description: t("connection_error_desc") });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded shadow">
      <form onSubmit={handleSubmit} className="space-y-2">
        <PageHeader title={t("title")}></PageHeader>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>

        <EquipmentForm
          equipment={formData}
          onChange={handleChange}
          errors={errors}
          mode="edit"
        />
        <Button
          type="submit"
          className="w-full"
          variant="default"
          disabled={isLoading}
        >
          {isLoading ? t("loading") : t("button")}
        </Button>
      </form>
    </div>
  );
}
