"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { promotionSchema } from "@/lib/validation/promotionSchema";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import PromotionForm from "@/components/modules/promotions/PromotionForm";

interface CreatePromotionProps {
  onBack?: () => void;
}

type PromotionFormValues = z.infer<typeof promotionSchema>;

export default function CreatePromotion({ onBack }: CreatePromotionProps) {
  const t = useTranslations("catalog.Promotions.create");
  const { token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: PromotionFormValues) => {
    if (!token) {return;}
    setIsLoading(true);

    try {
      const promotionData = {
        name: values.name,
        code: values.code.toUpperCase(),
        discount_type: values.discount_type, 
        discount_value: values.discount_value,
        start_date: `${values.start_date}T00:00:00Z`,
        end_date: `${values.end_date}T23:59:59Z`,
        is_active: values.is_active,
      };

      await api.marketing.createPromotion(promotionData, token);

      toast.success(t("success_title"), {
        description: t("success_description", { code: promotionData.code }),
      });

      if (typeof onBack === "function") {
        onBack(); 
      } else {
        router.push("/marketing/promotions"); 
      }
      
    } catch (error: any) {
      console.error("Error al crear promoción:", error);
      toast.error(t("error_title"), {
        description: error.message || t("error_default"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (typeof onBack === "function") {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <PageHeader title={t("title")} />

      <p className="text-sm text-muted-foreground">
        {t("subtitle")}
      </p>

      <PromotionForm mode="create" onSubmit={handleSubmit} />

      <div className="flex gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
          disabled={isLoading}
        >
          {t("button_cancel")}
        </Button>
        <Button
          type="submit"
          form="promotion-form"
          disabled={isLoading}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
        >
          {isLoading ? t("button_loading") : t("button_submit")}
        </Button>
      </div>
    </div>
  );
}