"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PlusIcon } from "@heroicons/react/24/outline";
import { usePromotions } from "@/hooks/promotions/usePromotions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl"; 
import PromotionsTable from "@/components/modules/promotions/PromotionsTable";

export default function PromotionsPage() {
  const t = useTranslations("catalog.Promotions");
  const { token } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    status: undefined,
  });

  const { 
    isLoading, 
    promotionData, 
    error, 
    totalItems, 
    totalPages,
    mutate: reload
  } = usePromotions(token, filters, page);

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); 
  };

  const statsData = {
    Total: totalItems || 0,
    Active: promotionData?.filter(p => p.is_active).length || 0,
    Inactive: promotionData?.filter(p => !p.is_active).length || 0,
  };

  const statCardsConfig = [
    { 
      title: t("stats.total"), 
      value: statsData.Total, 
      color: "text-slate-900" 
    },
    { 
      title: t("stats.active"), 
      value: statsData.Active, 
      color: "text-green-600" 
    },
    { 
      title: t("stats.inactive"), 
      value: statsData.Inactive, 
      color: "text-red-600" 
    },
  ];

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-red-500">
        {t("error_loading")}: {error.message}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")}>
        <Button
          variant="default"
          onClick={() => router.push("/marketing/promotions/new")}
          className="flex items-center gap-2 font-semibold shadow-sm bg-orange-600 hover:bg-orange-700"
        >
          <PlusIcon className="h-5 w-5" />
          {t("add_button")}
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCardsConfig.map((card, idx) => (
          <StatCard
            key={idx}
            title={card.title}
            value={
              <div className="flex items-baseline">
                <span className={`text-2xl font-bold tracking-tight ${card.color}`}>
                  {card.value}
                </span>
                <span className="ml-1.5 text-xs font-medium text-muted-foreground uppercase">
                  {t("stats.unit")}
                </span>
              </div>
            }
          />
        ))}
      </div>

      <PromotionsTable
        data={promotionData || []}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages || 1}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFilterChange={handleFilterChange}
        filterValues={filters}
        onReload={() => reload()} 
      />
    </div>
  );
}