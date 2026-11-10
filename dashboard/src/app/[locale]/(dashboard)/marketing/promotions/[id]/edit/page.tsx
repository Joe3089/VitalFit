"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { promotionSchema } from "@/lib/validation/promotionSchema";
import { useTranslations } from "next-intl";
import PromotionForm from "@/components/modules/promotions/PromotionForm";

type PromotionFormValues = z.infer<typeof promotionSchema>;

export default function PromotionEdit() {
  const t = useTranslations("catalog.Promotions.edit");
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [initialData, setInitialData] = useState<PromotionFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchPromotion = async () => {
      if (!token || !id) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.marketing.getPromotionByID(id as string, token);
        const promo = response.data;

        if (!promo) {
          toast.error(t("not_found"));
          router.push("/marketing/promotions");
          return;
        }

        setInitialData({
          name: promo.name,
          code: promo.code,
          discount_type: promo.discount_type as "Percentage" | "Fixed",
          discount_value: promo.discount_value,
          is_active: promo.is_active,
          start_date: promo.start_date.split("T")[0],
          end_date: promo.end_date.split("T")[0],
        });
      } catch (error) {
        toast.error(t("error_fetch"));
        router.push("/marketing/promotions");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotion();
  }, [id, token, router, t]);

  const handleSubmit = async (values: PromotionFormValues, isDirty: boolean) => {

    if (!isDirty) {
      toast.info("No se detectaron cambios"); 
      return;
    }

    if (!token || !id) {return;}
    setIsUpdating(true);

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

      await api.marketing.updatePromotion(id as string, promotionData, token);
      toast.success(t("success_update"));
      router.push("/marketing/promotions");
    } catch (error: any) {
      toast.error(t("error_update"), {
        description: error.message || t("error_update_description"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground italic">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <PageHeader title={t("title")} />
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      {initialData && (
        <PromotionForm
          mode="edit"
          initialData={initialData}
          onSubmit={(values, isDirty) => handleSubmit(values, isDirty)}
        />
      )}

      <div className="flex gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
          disabled={isUpdating}
        >
          {t("button_cancel")}
        </Button>
        <Button
          type="submit"
          form="promotion-form"
          disabled={isUpdating}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isUpdating ? t("button_loading") : t("button_submit")}
        </Button>
      </div>
    </div>
  );
}