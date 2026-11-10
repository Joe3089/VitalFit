"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useClientMembership } from "@/hooks/membership/useClientMembership";
import MembershipManagementTable from "@/components/modules/membership/MembershipManagementTable";

export default function MembershipManagement() {
  const t = useTranslations("finance.MembershipManagement");
  const { token } = useAuth();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });

  const { memberships, total, loading, fetchMembership } = useClientMembership(token || "");

  useEffect(() => {

    const effectiveSearch = filters.search.trim() !== "" 
      ? filters.search 
      : (filters.status !== "all" ? filters.status : "");

    fetchMembership({
      page: page,
      search: effectiveSearch
    });
  }, [fetchMembership, page, filters.search, filters.status]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilters: Partial<{ search: string; status: string }>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); 
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")} />

      <MembershipManagementTable
        data={memberships}
        isLoading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      {!loading && memberships.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {t("noResults")}
          </p>
        </div>
      )}
    </div>
  );
}