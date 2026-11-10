"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useEditServiceData } from "@/hooks/services/useEditServiceData";
import { ServiceForm } from "@/components/modules/services/ServiceForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ServiceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const t = useTranslations("catalog.services");
  const serviceId = id as string;

  const { service, categories, banners, isLoading } = useEditServiceData(serviceId, token);

  const formData = useMemo(() => {
    if (!service) {
      return null;
    }

    return {
      name: service.name || "",
      description: service.description || "",
      category_id: service.category_id || service.service_category?.category_id || "",
      duration: (service.duration_minutes || "").toString(),
      priority: (service.priority_score || "").toString(),
      is_featured: service.is_featured ? "true" : "false",
      banner_id: service.banners?.[0]?.banner_id || "",
    };
  }, [service]);

  const viewableImages = useMemo(() => {
    return service?.images?.map((img: any) => ({
      id: img.image_id,
      url: img.image_url,
      description: img.alt_text,
      isPrimary: img.is_primary,
    })) || [];
  }, [service]);

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        {t("CreateService.loadingData")}
      </div>
    );
  }

  if (!service || !formData) {
    return (
      <div className="p-8 text-center text-red-500">
        {t("notifications.loadError")}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between border-b pb-4">
        <PageHeader 
          title={t("table.actions.view").toUpperCase()} 
          subtitle={`${t("CreateService.subtitle_edit")}: ${service.name}`} 
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            {t("CreateService.buttons.cancel")}
          </Button>
          <Button 
            variant="default" 
            onClick={() => router.push(`/catalog/services/${serviceId}/edit`)}
          >
            {t("table.actions.edit")}
          </Button>
        </div>
      </div>

      <ServiceForm
        mode="view"
        formData={formData}
        formErrors={{}}
        handleChange={() => {}} 
        categories={categories}
        banners={banners}
        serviceImages={viewableImages}
        onImagesChange={() => {}}
        onPreviewImage={(img) => window.open(img.url, "_blank")} 
      />
    </div>
  );
}