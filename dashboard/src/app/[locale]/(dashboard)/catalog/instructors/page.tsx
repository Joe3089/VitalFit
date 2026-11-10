"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react"; // Iconos para la exportación
import { useAuth } from "@/context/AuthContext";
import { useInstructors } from "@/hooks/instructor/useInstructors";
import { useRouter } from "@/i18n/navigation";

import { useTranslations } from "next-intl";
import InstructorsTable from "@/components/modules/instructor/InstructorTable";

// --- INTEGRACIÓN DE EXPORTACIÓN ---
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";

export default function InstructorPage() {
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.instructor");

  const { handleExport, isExporting } = useExport();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    sort: "desc" as "asc" | "desc",
    identity_doc: "",
  });

  const { data, summary, isLoading, totalPages, refresh } = useInstructors(
    token,
    page,
    filters,
  );

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const onExportInstructors = () => {
    const baseFileName = t("export_filename");

    handleExport(
      "instructors-list", 
      (jwt) => api.exports.exportInstructors(jwt), 
      `${baseFileName}_${new Date().toISOString().split("T")[0]}`,
      "csv",
    );
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t("stats.total")}
          value={<h3 className="ml-1.5 font-bold">{summary?.total ?? 0}</h3>}
        />
        <StatCard
          title={t("stats.active")}
          value={
            <h3 className="ml-1.5 font-bold text-green-600">
              {summary?.actives ?? 0}
            </h3>
          }
        />
      </div>

      <PageHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportInstructors}
            disabled={isExporting === "instructors-list" || isLoading}
          >
            {isExporting === "instructors-list" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "instructors-list" ? t("exporting") : t("export")}
          </Button>

          <Button onClick={() => router.push("/catalog/instructors/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t("add_button")}
          </Button>
        </div>
      </PageHeader>

      <InstructorsTable
        data={data}
        isLoading={isLoading}
        onReload={refresh}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
