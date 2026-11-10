"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import PackageTable from "./PackageTable";
import { useTranslations } from "next-intl";
import { usePackages } from "@/hooks/packages/usePackages";
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";

export default function PackagesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.packages");

  const { handleExport, isExporting } = useExport();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [filters, setFilters] = useState({
    search: "",
  });

  const { packageData, isLoading, totalPages, refresh } = usePackages(
    token,
    page,
    pageSize,
    filters,
  );

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleFilterChange = (newFilters: { search?: string }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const onExportPackages = () => {
    const baseFileName = t("export_filename");

    handleExport(
      "packages-list", 
      (jwt) => api.exports.exportPackages(jwt), 
      `${baseFileName}_${new Date().toISOString().split("T")[0]}`,
      "csv", 
    );
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")} subtitle="">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportPackages}
            disabled={isExporting === "packages-list" || isLoading}
          >
            {isExporting === "packages-list" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "packages-list" ? t("exporting") : t("export")}
          </Button>

          <Button
            onClick={() => router.push("/catalog/packages/new")}
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            {t("add_button")}
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">{t("loading")}</span>
        </div>
      ) : (
        <PackageTable
          data={packageData}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReload={refresh}
        />
      )}
    </div>
  );
}
