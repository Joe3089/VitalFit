"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useRouter } from "@/i18n/navigation";
import ServicesTable from "@/components/modules/services/ServicesTable";
import { useAuth } from "@/context/AuthContext";
import { useServices } from "@/hooks/services/useServices";
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const t = useTranslations("catalog.services");
  const router = useRouter();
  const { token } = useAuth();

  const { handleExport, isExporting } = useExport();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", category: "all" });

  const {
    services,
    categories,
    isLoading,
    totalPages,
    totalItems,
    summary,
    refresh,
  } = useServices(token, page, filters);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleFilterChange = (newFilters: {
    search?: string;
    category?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const onExportServices = () => {
    const baseFileName = t("export_filename");

    handleExport(
      "services-catalog",
      (jwt) => api.exports.exportServices(jwt),
      `${baseFileName}_${new Date().toISOString().split("T")[0]}`,
      "csv",
    );
  };

  const statCardsConfig = useMemo(
    () => [
      {
        title: t("stats.total"),
        value: summary?.total,
        fontColor: "text-blue-600",
      },
      {
        title: t("stats.actives"),
        value: summary?.actives,
        fontColor: "text-green-600",
      },
      {
        title: t("stats.featured"),
        value: summary?.featured,
        fontColor: "text-purple-600",
      },
    ],
    [t, summary],
  );

  if (!token) {
    return null;
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {statCardsConfig.map((card, idx) => (
          <StatCard
            key={idx}
            title={card.title}
            isLoading={isLoading}
            value={
              <div className="flex items-baseline gap-1.5">
                <span className=" text-2xl tabular-nums tracking-tight">
                  {card.value ?? 0}
                </span>
                <span
                  className={cn(
                    "text-2xl ",
                    card.fontColor,
                  )}
                >
                  {t("stats.unit")}
                </span>
              </div>
            }
          />
        ))}
      </div>

      <PageHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportServices}
            disabled={isExporting === "services-catalog" || isLoading}
          >
            {isExporting === "services-catalog" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "services-catalog" ? t("exporting") : t("export")}
          </Button>
          <Button onClick={() => router.push("/catalog/services/new")}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t("add_button")}
          </Button>
        </div>
      </PageHeader>

      <ServicesTable
        data={services}
        categories={categories}
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
