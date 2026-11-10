"use client";
import BranchesTable from "./BranchesTable";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/sdk-config";
import {
  PaginatedBranch,
  BranchStatusCount,
  Pagination,
  PaymentMethod,
} from "@vitalfit/sdk";
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { Country } from "@/models/location";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export type PaymentMethodUI = PaymentMethod & {
  icon?: React.ElementType;
};

const MOCK_COUNTRIES: Country[] = [{ id: "co1", name: "Venezuela" }];

function mapApiPaymentMethodsToUI(methods: PaymentMethod[]): PaymentMethodUI[] {
  return methods.map((method) => {
    let IconComponent: React.ElementType | undefined;
    switch (method.type.toLowerCase()) {
      case "cash":
        IconComponent = BanknotesIcon;
        break;
      case "card":
        IconComponent = CreditCardIcon;
        break;
      case "transfer":
        IconComponent = BuildingLibraryIcon;
        break;
      case "mobile":
        IconComponent = DevicePhoneMobileIcon;
        break;
    }
    return { ...method, icon: IconComponent };
  });
}

export default function HomeBranches() {
  const t = useTranslations("branches");
  const { token } = useAuth();
  const router = useRouter();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [statsData, setStatsData] = useState<BranchStatusCount>({
    Active: 0,
    Inactive: 0,
    Maintenance: 0,
    Total: 0,
  });
  const [branchesData, setBranchesData] = useState<PaginatedBranch[]>([]);

  const [filters, setFilters] = useState<Record<string, string | undefined>>(
    {},
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [totalBranches, setTotalBranches] = useState(0);
  const totalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(totalBranches / pageSize)) : 1;
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string | undefined) => {
    setPage(1);
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const statCardsConfig: {
    title: string;
    valueKey: keyof BranchStatusCount | "Total";
  }[] = [
      { title: t("stats.total"), valueKey: "Total" },
      { title: t("stats.active"), valueKey: "Active" },
      { title: t("stats.inactive"), valueKey: "Inactive" },
      { title: t("stats.maintenance"), valueKey: "Maintenance" },
    ];

  useEffect(() => {
    async function loadBranchesData() {
      setIsLoadingBranches(true);
      try {
        const searchTerms = filters.name || filters.tax_id;
        const statusFilter = filters.status;

        const branchesResult: Pagination<PaginatedBranch[]> =
          await api.branch.getBranches(
            {
              limit: pageSize,
              page,
              sort,
              search: searchTerms,
              status: statusFilter,
            },
            token || "",
          );
        setBranchesData(branchesResult.data);

        api.branch.getBranchStatusCount(token || "").then((data) => {
          setStatsData(data.data);
          const hasActiveFilters = Object.values(filters).some((f) => f);
          const total = hasActiveFilters
            ? branchesResult.count
            : data.data.Total;
          setTotalBranches(total);
        });
      } catch (error) {
        console.error("Error cargando sucursales:", error);
      } finally {
        setIsLoadingBranches(false);
      }
    }
    loadBranchesData();
  }, [page, pageSize, sort, filters, refreshKey, token]);

  useEffect(() => {
    const status = searchParams.get("status");

    if (status === "success") {
      setShowSuccessAlert(true);
      setRefreshKey((prev) => prev + 1);

      router.replace("/branches", undefined);
    }
  }, [searchParams, router]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader
        title={t("title")}
        actionButton={
          <Button
            variant="default"
            onClick={() => router.push("/branches/new")}
          >
            <PlusIcon className="h-5 w-5" />
            {t("add_button")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCardsConfig.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={
              <>
                {card.valueKey === "Total"
                  ? statsData.Active +
                  statsData.Inactive +
                  statsData.Maintenance
                  : (statsData[card.valueKey] ?? 0)}
                <span className="ml-1.5 text-base font-normal">{t("stats.unit")}</span>
              </>
            }
          />
        ))}
      </div>
      <BranchesTable
        data={branchesData}
        isLoading={isLoadingBranches}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFilterChange={handleFilterChange}
        onBranchDeleted={() => setRefreshKey((prev) => prev + 1)}
        filterValues={filters}
      />

      <GeneralAlertDialog
        open={showSuccessAlert}
        onOpenChange={setShowSuccessAlert}
        trigger={<span />}
        type="info"
        title={t("notifications.success_title")}
        description={t("notifications.success_description")}
        actionText={t("notifications.action_text")}
      />
    </div>
  );
}
