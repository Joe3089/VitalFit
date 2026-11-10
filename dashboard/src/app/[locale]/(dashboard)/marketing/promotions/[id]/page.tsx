"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Promotion } from "@vitalfit/sdk";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import PromotionForm from "@/components/modules/promotions/PromotionForm";

export default function PromotionDetails() {
  const t = useTranslations("catalog.Promotions.details");
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromotion = async () => {
      if (!token || !id){
         return;
      }

      try {
        const response = await api.marketing.getPromotionByID(id as string, token);
        
        const formattedData = {
          ...response.data,
          start_date: response.data.start_date.split("T")[0],
          end_date: response.data.end_date.split("T")[0],
        };
        
        setPromotion(formattedData);
      } catch (error) {
        console.error(error);
        toast.error(t("error_fetch"));
        router.push("/marketing/promotions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotion();
  }, [id, token, router, t]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        {t("loading")}
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">{t("not_found")}</h2>
        <Button variant="outline" onClick={() => router.replace("/marketing/promotions")}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> {t("button_list")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <PageHeader title={t("title")} />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            {t("button_back")}
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => router.push(`/marketing/promotions/${id}/edit`)}
          >
            {t("button_edit")}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("subtitle")}
      </p>
      <PromotionForm
        mode="view" 
        initialData={promotion} 
        onSubmit={() => {}} 
      />
    </div>
  );
}