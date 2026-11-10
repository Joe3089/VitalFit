"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditServiceData } from "@/hooks/services/useEditServiceData";
import { useEditServiceForm } from "@/hooks/services/useEditServiceForm";
import { useServiceImages } from "@/hooks/services/useServiceImages";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceForm } from "@/components/modules/services/ServiceForm";

export default function EditService() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.services");

  const abortControllerRef = useRef<AbortController | null>(null);
  const serviceId = id as string;
  
  const isInitialized = useRef(false);

  const { service, categories, banners, isLoading } = useEditServiceData(serviceId, token);
  const imgHook = useServiceImages();

 const formHook = useEditServiceForm(serviceId, token, () => {
    router.refresh(); 
    setTimeout(() => router.replace("/catalog/services"), 1500);
  });

useEffect(() => {
    if (service && categories.length > 0 && !isInitialized.current) {

      const rawService = service as any;

      const dataForForm = {
        ...service,

        category_id: service.category_id ? String(service.category_id) : "",
        
        duration: service.duration_minutes?.toString() || "",
        priority: service.priority_score?.toString() || "",
       is_featured: service.is_featured ? "true" : "false",
        banner_id: rawService.banner_id || ""
      };

      formHook.fillForm(dataForForm);

      const initialImgs = service.images?.map((img: any, i: number) => ({
        id: img.image_id || `idx-${i}`,
        file: new File([], "existing_file"),
        preview: img.image_url,
        originalPreview: img.image_url, 
        url: img.image_url,
        status: "uploaded" as const,
        isPrimary: img.is_primary,
        order: img.display_order || i,
        description: img.alt_text || "",
      })) || [];
      
      imgHook.setServiceImages(initialImgs);
      isInitialized.current = true;
    }
  }, [service, categories, formHook.fillForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    abortControllerRef.current = new AbortController();
    let toastId: string | number | undefined;

    try {
      toastId = toast.loading(t("notifications.uploadingImages"));

      const imagesPayload = await imgHook.processAndUpload(
        formHook.formData.name,
        abortControllerRef.current.signal
      );

      toast.dismiss(toastId);
      await formHook.submitUpdate(imagesPayload);

    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId);
      }
      if (error.name === "AbortError") {
        return;
      }

      toast.error(t("notifications.processError"), {
        description: error.message || "Ocurrió un error inesperado"
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">{t("CreateService.loadingData")}</div>;
  }

  if (!service) {
    return <div className="p-8 text-center text-red-500">Error: Service not found</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between border-b pb-4">
        <PageHeader
          title={t("CreateService.title_edit")}
          subtitle={`${t("CreateService.subtitle_edit")}: ${service.name}`}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <ServiceForm
          mode="edit"
          formData={formHook.formData}
          formErrors={formHook.formErrors}
          handleChange={formHook.handleChange}
          categories={categories}
          banners={banners}
          serviceImages={imgHook.serviceImages}
          onImagesChange={imgHook.setServiceImages}
          isSubmitting={formHook.isSubmitting}
          isUploadingImages={imgHook.isUploading}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
            disabled={formHook.isSubmitting || imgHook.isUploading}
          >
            {t("CreateService.buttons.cancel")}
          </Button>

          <Button
            variant="default"
            type="submit"
            disabled={formHook.isSubmitting || imgHook.isUploading}
            className="min-w-[120px]"
          >
            {imgHook.isUploading
              ? t("CreateService.buttons.uploading")
              : formHook.isSubmitting
                ? t("CreateService.buttons.saving")
                : t("CreateService.buttons.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}