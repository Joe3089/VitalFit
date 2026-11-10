"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/modules/services/ImageUploader";
import { EyeIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { ServiceCategoryInfo, Banner } from "@vitalfit/sdk";

interface ServiceFormProps {
  mode: "create" | "edit" | "view";
  formData: any;
  formErrors: any;
  handleChange: (field: string, value: any) => void;
  categories: ServiceCategoryInfo[];
  banners: Banner[];
  serviceImages: any[];
  onImagesChange: (images: any[]) => void;
  onPreviewImage?: (image: any) => void;
  isSubmitting?: boolean;
  isUploadingImages?: boolean;
}

export function ServiceForm({
  mode,
  formData,
  formErrors,
  handleChange,
  categories,
  banners,
  serviceImages,
  onImagesChange,
  onPreviewImage,
}: ServiceFormProps) {
  const t = useTranslations("catalog.services.CreateService");
  const isView = mode === "view";

  if (!formData) {
    return null;
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general">
          {t("tabs.general") || "General"}
        </TabsTrigger>
        <TabsTrigger value="images">
          {t("tabs.images") || "Imágenes y Banner"}
        </TabsTrigger>
      </TabsList>

      <div className="space-y-6 pt-6">
        <TabsContent value="general" className="space-y-6 outline-none">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className={formErrors?.name ? "text-red-500" : ""}>
                {t("fields.name")} *
              </Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={isView}
                className={`${isView ? "bg-gray-50" : ""} ${formErrors?.name ? "border-red-500" : ""}`}
                placeholder={t("fields.namePlaceholder")}
              />
              {formErrors?.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("fields.category")} *</Label>
              <Select
                key={`select-cat-${formData.category_id}-${categories.length}`}
                value={formData.category_id ? String(formData.category_id) : ""}
                onValueChange={(v) => handleChange("category_id", v)}
                disabled={isView || categories.length === 0}
              >
                <SelectTrigger
                  className={formErrors?.category_id ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      categories.length === 0
                        ? "Cargando..."
                        : t("fields.categoryPlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {categories.map((c) => (
                    <SelectItem
                      key={c.category_id}
                      value={String(c.category_id)}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors?.category_id && (
                <p className="text-xs text-red-500">{formErrors.category_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className={formErrors?.description ? "text-red-500" : ""}>
              {t("fields.description")} *
            </Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isView}
              className={`${isView ? "bg-gray-50" : ""} ${formErrors?.description ? "border-red-500" : ""}`}
              rows={4}
            />
            {formErrors?.description && (
              <p className="text-xs text-red-500">{formErrors.description}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("fields.duration")} *</Label>
              <Input
                type="number"
                value={formData.duration || ""}
                onChange={(e) => handleChange("duration", e.target.value)}
                disabled={isView}
                className={isView ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("fields.priority") || "Prioridad"}</Label>
              <Select
                key={formData.priority}
                value={formData.priority?.toString() || ""}
                onValueChange={(v) => handleChange("priority", v)}
                disabled={isView}
              >
                <SelectTrigger className={isView ? "bg-gray-50" : ""}>
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {Array.from(
                    new Set([
                      "1",
                      "5",
                      "10",
                      "15",
                      "20",
                      "25",
                      "30",
                      "35",
                      "40",
                      "45",
                      "50",
                      "55",
                      "60",
                      "65",
                      "70",
                      "75",
                      "80",
                      "85",
                      "90",
                      "95",
                      "100",
                      formData.priority?.toString(),
                    ])
                  )
                    .filter(Boolean)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Nivel {n}{" "}
                        {n === "1" ? "(Bajo)" : n === "100" ? "(Máximo)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("fields.featured") || "Destacado"}</Label>
              <Select
                key={`featured-${formData.is_featured}`}
                value={String(formData.is_featured)}
                onValueChange={(v) => handleChange("is_featured", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-6 outline-none">
          <div className="space-y-2">
            <Label>{t("fields.banner")} *</Label>
            <Select
              key={formData.banner_id}
              value={formData.banner_id || ""}
              onValueChange={(v) => handleChange("banner_id", v)}
              disabled={isView}
            >
              <SelectTrigger className={isView ? "bg-gray-50" : ""}>
                <SelectValue placeholder={t("fields.bannerPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {banners.map((b) => (
                  <SelectItem key={b.banner_id} value={String(b.banner_id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">
              {t("fields.imagesTitle")}
            </Label>
            {isView ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {serviceImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative border rounded-lg overflow-hidden bg-gray-50"
                  >
                    <img
                      src={img.url}
                      alt={img.description}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-3 flex items-center justify-between bg-white">
                      <div className="truncate">
                        <p className="text-xs font-medium truncate">
                          {img.fileName || img.description}
                        </p>
                        {img.isPrimary && (
                          <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-1">
                            <StarIconSolid className="w-3 h-3" /> Principal
                          </span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        onClick={() => onPreviewImage?.(img)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ImageUploader
                maxFiles={8}
                aspect={16 / 9}
                onChange={onImagesChange}
                initialImages={serviceImages}
                disableManualUpload={true}
              />
            )}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
