import { useState } from "react";
import { toast } from "sonner";
import { triggerBrowserDownload } from "@/lib/download-utils";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export type ExportFormat = "csv" | "excel" | "pdf";

export function useExport() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { token } = useAuth();
  const t = useTranslations("common.notifications");

  const handleExport = async (
    exportId: string,
    exportFn: (token: string) => Promise<any>, 
    fileName: string,
    format: ExportFormat = "csv"
  ) => {
    if (!token) {
      return;
    }

    try {
      setIsExporting(exportId);
      
      const response = await exportFn(token);

      const blob = response?.blob || response;

      if (!blob || !(blob instanceof Blob)) {
        throw new Error("La respuesta no contiene un archivo válido (Blob)");
      }

      const extension = format === "excel" ? "xlsx" : format;
      
      triggerBrowserDownload(blob, `${fileName}.${extension}`);

      toast.success(t("export_success"));
    } catch (error) {
      console.error(`[Export Error] ${exportId}:`, error);
      toast.error(t("export_error"));
    } finally {
      setIsExporting(null);
    }
  };

  return { handleExport, isExporting };
}