"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2, FileDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ClientsTable from "@/components/modules/clients/ClientsTable";
import { useClients } from "@/hooks/clients/useClients";
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";

export default function Clients() {
  const t = useTranslations("clients");
  const router = useRouter();
  const { token } = useAuth();

  const { handleExport, isExporting } = useExport();

  const [searchInput, setSearchInput] = useState("");

  const {
    data,
    isLoading,
    pagination,
    filters,
    onFilterChange,
    stats,
    reload,
  } = useClients({ token, initialLimit: 10 });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput, onFilterChange, filters.search]);

  const localDate = new Date();
  const formattedDate = [
    localDate.getFullYear(),
    String(localDate.getMonth() + 1).padStart(2, "0"),
    String(localDate.getDate()).padStart(2, "0"),
  ].join("-");

  const onExportClick = () => {
    const fileName = t("export_filename");

    handleExport(
      "clients-list",
      (jwt) => api.exports.exportClients(jwt),
      `${fileName}_${formattedDate}`,
      "csv",
    );
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t("stats.total")}
          value={<h3 className="text-4xl font-bold">{stats.total}</h3>}
          description={t("stats.unit")}
        />
        <StatCard
          title={t("stats.active")}
          value={
            <h3 className="text-4xl font-bold text-green-600">
              {stats.active}
            </h3>
          }
          description={t("stats.unit")}
        />
        <StatCard
          title={t("stats.inactive")}
          value={
            <h3 className="text-4xl font-bold text-destructive">
              {stats.blocked}
            </h3>
          }
          description={t("stats.unit")}
        />
      </div>

      <PageHeader
        title={t("title")}
        subtitle={t("description", { count: stats.total })}
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onExportClick}
            disabled={isExporting !== null || isLoading}
          >
            {isExporting === "clients-list" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "clients-list"
              ? t("exporting")
              : t("export_button")}
          </Button>
          <Button onClick={() => router.push("/clients/register/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t("add_button")}
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 p-3">
        {isLoading && data.length === 0 ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t("table.loading")}
            </span>
          </div>
        ) : (
          <ClientsTable
            data={data}
            onReload={reload}
            page={pagination.page}
            pageSize={pagination.limit}
            onPageChange={pagination.onPageChange}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            filters={filters}
            onFilterChange={onFilterChange}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
