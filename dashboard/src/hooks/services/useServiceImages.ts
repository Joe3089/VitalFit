import { useState } from "react";
import { CreateServiceImage } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";

export type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  originalPreview: string;
  croppedBlob?: Blob;
  status: "pending" | "cropped" | "uploading" | "uploaded" | "error";
  url?: string;
  order: number;
  description?: string;
  isPrimary?: boolean;
};

export function useServiceImages() {

  const t = useTranslations("catalog.services.CreateService.notifications");
  
  const [serviceImages, setServiceImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadToImgBB = async (file: File, signal?: AbortSignal): Promise<string> => {
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(t("processError") + ": Max 5MB");
    }

    const formData = new FormData();
    formData.append("image", file);
    const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB;

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: "POST",
      body: formData,
      signal, 
    });

    const json = await res.json();
    if (!res.ok || !json.data?.url) {
      throw new Error(t("processError"));
    }
    return json.data.url;
  };

  const processAndUpload = async (
    serviceName: string, 
    signal?: AbortSignal
  ): Promise<CreateServiceImage[]> => {
    setIsUploading(true);
    try {
      const results: CreateServiceImage[] = [];
      
      for (const [index, img] of serviceImages.entries()) {
        if (signal?.aborted) {
          throw new Error("AbortError");
        }

        let imageUrl = img.url;
        if (!imageUrl) {
          const fileToUpload = img.croppedBlob
            ? new File([img.croppedBlob], img.file.name || "image.jpg", { type: "image/jpeg" })
            : img.file;
            
          imageUrl = await uploadToImgBB(fileToUpload, signal);
        }

        results.push({
          image_url: imageUrl,
          alt_text: img.description || `Image ${index + 1} - ${serviceName}`,
          display_order: img.order,
          is_primary: img.isPrimary || index === 0,
        });
      }
      return results;
    } finally {
      setIsUploading(false);
    }
  };

  return { serviceImages, setServiceImages, isUploading, processAndUpload };
}