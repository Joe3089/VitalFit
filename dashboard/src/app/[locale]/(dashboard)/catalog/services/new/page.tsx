"use client";

import { useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { useServiceData } from "@/hooks/services/useServiceData";
import { useServiceImages } from "@/hooks/services/useServiceImages";
import { useServiceForm } from "@/hooks/services/useServiceForm";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploader from "@/components/modules/services/ImageUploader";

export default function CreateService() {
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.services");

  const abortControllerRef = useRef<AbortController | null>(null);

  const { categories, banners, isLoading } = useServiceData(token);
  const imgHook = useServiceImages();

  const formHook = useServiceForm(token, () => {
    setTimeout(() => router.replace("/catalog/services"), 1500);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formHook.validate()) {
      return;
    }

    if (imgHook.serviceImages.length === 0) {
      toast.warning(t("notifications.missingImages"), {
        description: t("notifications.missingImagesDesc")
      });
      return;
    }

    abortControllerRef.current = new AbortController();
    let uploadToastId: string | number | undefined;

    try {
      uploadToastId = toast.loading(t("notifications.uploadingImages"));

      const uploadedImages = await imgHook.processAndUpload(
        formHook.formData.name,
        abortControllerRef.current.signal
      );

      toast.dismiss(uploadToastId);
      await formHook.submitService(uploadedImages);

    } catch (error: any) {
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }
      if (error.name === "AbortError") {
        return;
      }

      toast.error(t("notifications.processError"), {
        description: error.message || t("notifications.tryAgain")
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        {t("CreateService.loadingData")}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title={t("CreateService.title")}
          subtitle={t("CreateService.subtitle")}
        />

        <div className="grid gap-4 md:grid-cols-2">

          <div className="space-y-2">
            <Label>{t("CreateService.fields.name")} *</Label>
            <Input
              value={formHook.formData.name}
              onChange={(e) => formHook.handleChange("name", e.target.value)}
              className={formHook.formErrors.name ? "border-red-500" : ""}
              placeholder={t("CreateService.fields.namePlaceholder")}
            />
            {formHook.formErrors.name && (
              <p className="text-xs text-red-500 font-medium">{formHook.formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("CreateService.fields.category")} *</Label>
            <Select
              value={formHook.formData.category_id}
              onValueChange={(v) => formHook.handleChange("category_id", v)}
            >
              <SelectTrigger className={formHook.formErrors.category_id ? "border-red-500" : ""}>
                <SelectValue placeholder={t("CreateService.fields.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category_id} value={c.category_id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("CreateService.fields.description")} *</Label>
          <Textarea
            value={formHook.formData.description}
            onChange={(e) => formHook.handleChange("description", e.target.value)}
            placeholder={t("CreateService.fields.descriptionPlaceholder")}
            className={formHook.formErrors.description ? "border-red-500" : ""}
            rows={4}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("CreateService.fields.duration")} *</Label>
            <Input
              type="number"
              value={formHook.formData.duration}
              onChange={(e) => formHook.handleChange("duration", e.target.value)}
              className={formHook.formErrors.duration ? "border-red-500" : ""}
              placeholder="60"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("CreateService.fields.priority")}</Label>
            <Select
              value={formHook.formData.priority}
              onValueChange={(v) => formHook.handleChange("priority", v)}
            >
              <SelectTrigger className={formHook.formErrors.priority ? "border-red-500" : ""}>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Array.from(new Set(["1", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100", formHook.formData.priority]))
                  .filter(Boolean)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((n) => (
                    <SelectItem key={n} value={n!.toString()}>
                      Nivel {n} {n === "1" ? "(Bajo)" : n === "100" ? "(Máximo)" : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("CreateService.fields.featured") || "Destacado"}</Label>
            <Select
              value={formHook.formData.is_featured}
              onValueChange={(v) => formHook.handleChange("is_featured", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sí</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("CreateService.fields.banner")}</Label>
          <Select
            value={formHook.formData.banner_id}
            onValueChange={(v) => formHook.handleChange("banner_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("CreateService.fields.bannerPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {banners.filter(b => b.is_active).map((b) => (
                <SelectItem key={b.banner_id} value={b.banner_id || ""}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

         <div className="space-y-4 border-t pt-4">
          <Label className="text-lg font-semibold">{t("CreateService.fields.imagesTitle")} *</Label>
          <ImageUploader
            maxFiles={8}
            aspect={16 / 9}
            onChange={imgHook.setServiceImages}
            disableManualUpload={true}
          />
          <p className="text-xs text-muted-foreground italic">
            {t("CreateService.fields.imagesHelper")}
          </p>
        </div>


        <div className="flex gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            {t("CreateService.buttons.cancel")}
          </Button>
          <Button type="submit" disabled={formHook.isSubmitting || imgHook.isUploading} className="flex-1">
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