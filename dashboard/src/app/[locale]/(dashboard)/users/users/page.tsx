"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext";
import UsersTable from "./UsersTable";
import { useStaffUsers } from "@/hooks/staff/useStaffUsers";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";

export default function UsersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const t = useTranslations("user.management");

  const { handleExport, isExporting } = useExport();

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [filters, setFilters] = useState({
    search: "",
    role: "",
  });

  const { users, isLoading, refresh, error } = useStaffUsers(token, filters);

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return users.slice(startIndex, endIndex);
  }, [users, page, pageSize]);

  const totalPages = Math.ceil(users.length / pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilters: {
    search?: string;
    role?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const onExportStaff = () => {
    const baseFileName = t("export_filename");

    handleExport(
      "staff-list",
      (jwt) => api.exports.exportStaff(jwt),
      `${baseFileName}_${new Date().toISOString().split("T")[0]}`,
      "csv",
    );
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportStaff}
            disabled={isExporting === "staff-list" || isLoading}
          >
            {isExporting === "staff-list" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "staff-list" ? t("exporting") : t("export_button")}
          </Button>

          <Button
            onClick={() => router.replace("/users/users/new")}
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            {t("add_button")}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-md">{error}</div>
      )}

      <UsersTable
        data={paginatedUsers}
        isLoading={isLoading}
        onReload={refresh}
        filters={filters}
        onFilterChange={handleFilterChange}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
