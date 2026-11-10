"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react"; 
import { MembershipType } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/sdk-config";
import { useTranslations } from "next-intl";
import MembershipTable from "@/components/modules/membership/MembershipTable";
import { useExport } from "@/hooks/export/use-export";

export default function Membership() {
  const t = useTranslations("catalog.memberships");
  const router = useRouter();
  const { token } = useAuth();

  const { handleExport, isExporting } = useExport();

  const [membershipData, setMembershipData] = useState<MembershipType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    const loadMembershipData = async () => {
      if (!token){
         return;
      }

      setIsLoading(true);
      try {
        const result = await api.membership.getMembershipTypes(token, {
          page,
          limit: pageSize,
          sort: "desc",
          search: filters.search || undefined,
        });

        setMembershipData(result.data || []);
        setTotalItems(result.total || 0);
      } catch (error) {
        console.error("Error cargando membresías:", error);
        setMembershipData([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembershipData();
  }, [token, page, pageSize, filters.search, reloadFlag]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const handleFilterChange = (newFilters: { search?: string }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleReload = () => {
    setReloadFlag((prev) => prev + 1);
  };

  const onExportClick = () => {
    const fileName = t("export_filename");

    handleExport(
      "membership-plans", 
      (jwt) => api.exports.exportMembershipPlans(jwt),
      `${fileName}_${new Date().toISOString().split("T")[0]}`, 
      "csv", 
    );
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportClick}
            disabled={isExporting === "membership-plans" || isLoading}
          >
            {isExporting === "membership-plans" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "membership-plans" ? t("exporting") : t("export")}
          </Button>
          <Button
            onClick={() => router.push("/catalog/memberships/new")}
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
        <MembershipTable
          data={membershipData}
          page={page}
          onReload={handleReload}
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
