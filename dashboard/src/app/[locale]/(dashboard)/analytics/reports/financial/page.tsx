"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AccountsReceivableStat,
  ActiveBranchesCount,
  AverageCLV,
  MRRStat,
  WeeklyRevenueStat,
} from "@/components/modules/analytics/finance/FinancialStats";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  FileDown,
  Loader2,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Table,
} from "lucide-react";
import { ReportFilters } from "@/components/modules/analytics/ReportFilter";
import { useBranches } from "@/hooks/branches/useBranches";
import { ProjectedCashFlowReport } from "@/components/modules/analytics/finance/ProjectedCashFlow";
import { MonthlyRevenueReport } from "@/components/modules/analytics/finance/MonthlyRevenueReport";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  endOfDay,
} from "date-fns";
import { BillingMatrixReport } from "@/components/modules/analytics/finance/BillingMatrixBanch";
import { useTranslations } from "next-intl";
import { UserRole } from "@/lib/roles";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { ExportFormat, useExport } from "@/hooks/export/use-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FinancePage() {
  const t = useTranslations("analytics.finance");
  const { token, user, hasRole } = useAuth();

  const { handleExport, isExporting } = useExport();

  const activeBranchId = user?.activeBranch?.id;
  const isGlobalAdmin = hasRole([UserRole.SUPER_ADMIN]);

  const [branchId, setBranchId] = useState<string>(
    () => user?.activeBranch?.id || "all",
  );
  const [range, setRange] = useState("this-month");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (user?.activeBranch?.id && branchId === "all" && !isGlobalAdmin) {
      setBranchId(user.activeBranch.id);
    }
  }, [user, isGlobalAdmin, branchId]);

  useEffect(() => {
    const now = new Date();
    if (range === "this-month") {
      setStartDate(startOfMonth(now));
      setEndDate(endOfDay(now));
    } else if (range === "last-month") {
      const lastMonth = subMonths(now, 1);
      setStartDate(startOfMonth(lastMonth));
      setEndDate(endOfMonth(lastMonth));
    } else if (range === "last-3-months") {
      setStartDate(startOfMonth(subMonths(now, 2)));
      setEndDate(endOfDay(now));
    }
  }, [range]);

  const { branches, isLoading: loadingBranches } = useBranches({
    token: token ?? "",
    limit: 100,
  });

  const branchOptions = useMemo(() => {
    if (!isGlobalAdmin && user?.activeBranch) {
      return [{ value: user.activeBranch.id, label: user.activeBranch.name }];
    }
    return [
      { value: "all", label: t("filters.all_branches") },
      ...branches.map((b) => ({ value: b.branch_id, label: b.name })),
    ];
  }, [branches, isGlobalAdmin, user?.activeBranch, t]);

  const rangeOptions = [
    { value: "this-month", label: t("filters.ranges.this_month") },
    { value: "last-month", label: t("filters.ranges.last_month") },
    { value: "last-3-months", label: t("filters.ranges.last_3_months") },
    { value: "custom", label: t("filters.ranges.custom") },
  ];

  const selectedBranch = branchId === "all" ? undefined : branchId;
  const sDate = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
  const eDate = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

  const onExportFinancial = (formatType: ExportFormat) => {
    if (!sDate || !eDate) {
      toast.error(t("errors.select_dates"));
      return;
    }

    const baseFileName = t("export_filename") || "Reporte_Financiero";

    handleExport(
      "financial",
      (jwt) =>
        api.exports.exportFinancialReport(
          jwt,
          sDate,
          eDate,
          selectedBranch,
          formatType,
        ),
      `${baseFileName}_${sDate}_to_${eDate}`,
      formatType,
    );
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 p-6 md:p-10 space-y-8 pb-20">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actionButton={
          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="shadow-sm min-w-[160px] text-white font-bold text-xs uppercase tracking-widest"
                  disabled={isExporting !== null || !sDate || !eDate}
                >
                  {isExporting === "financial" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  {isExporting === "financial" ? t("exporting") : t("export")}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onExportFinancial("csv")}
                  className="cursor-pointer"
                >
                  <Table className="mr-2 h-4 w-4 text-slate-500" />
                  <span>{t("formats.csv")}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onExportFinancial("excel")}
                  className="cursor-pointer"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  <span>{t("formats.excel")}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onExportFinancial("pdf")}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  <span>{t("formats.pdf")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-4 z-10 backdrop-blur-md bg-white/80">
        <ReportFilters
          branches={branchOptions}
          branchValue={branchId}
          onBranchChange={setBranchId}
          ranges={rangeOptions}
          rangeValue={range}
          onRangeChange={setRange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(d) => {
            setStartDate(d);
            if (d) {
              setRange("custom");
            }
          }}
          onEndDateChange={(d) => {
            setEndDate(d);
            if (d) {
              setRange("custom");
            }
          }}
          loadingBranches={loadingBranches}
          onClear={() => {
            setBranchId(
              !isGlobalAdmin && activeBranchId ? activeBranchId : "all",
            );
            setRange("this-month");
          }}
        />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <WeeklyRevenueStat token={token} branchId={selectedBranch} />
        <MRRStat token={token} branchId={selectedBranch} />
        <AccountsReceivableStat token={token} branchId={selectedBranch} />
        <ActiveBranchesCount token={token} />
        <AverageCLV token={token} branchId={selectedBranch} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <ProjectedCashFlowReport token={token} branchId={selectedBranch} />
        <MonthlyRevenueReport token={token} branchId={selectedBranch} />
      </section>

      <section className="mt-10">
        <BillingMatrixReport token={token} startDate={sDate} endDate={eDate} />
      </section>
    </div>
  );
}
