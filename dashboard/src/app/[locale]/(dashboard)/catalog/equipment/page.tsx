"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext";
import { EquipmentCategory } from "@vitalfit/sdk";
import EquipmentTable from "./EquipmentTable";
import { useEquipment } from "@/hooks/equipment/useEquipment";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";

export default function Equipment() {
  const t = useTranslations("catalog.equipment");
  const router = useRouter();
  const { token } = useAuth();

  const { handleExport, isExporting } = useExport();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    search?: string;
    category?: EquipmentCategory;
  }>({
    search: "",
    category: undefined,
  });

  const { equipmentData, isLoading, totalPages, pageSize, refresh } =
    useEquipment(token, filters, page);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (newFilters: {
    search?: string;
    category?: EquipmentCategory;
  }) => {
    setFilters(newFilters);
    setPage(1);
  };

  const onExportEquipment = () => {
    const baseFileName = t("export_filename"); 

    handleExport(
      "equipment-catalog",
      (jwt) => api.exports.exportEquipmentTypes(jwt), 
      `${baseFileName}_${new Date().toISOString().split("T")[0]}`,
      "csv", 
    );
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportEquipment}
            disabled={isExporting === "equipment-catalog" || isLoading}
            className="hidden md:flex"
          >
            {isExporting === "equipment-catalog" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "equipment-catalog" ? t("exporting") : t("export")}
          </Button>

          <Button onClick={() => router.push("/catalog/equipment/new")}>
            <PlusIcon className="h-5 w-5 mr-1" />
            {t("addButton")}
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="text-center p-10 py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
          <span className="text-muted-foreground font-medium">
            {t("loading")}
          </span>
        </div>
      ) : (
        <EquipmentTable
          data={equipmentData}
          onReload={refresh}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
}
