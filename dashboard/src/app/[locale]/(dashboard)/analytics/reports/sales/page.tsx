"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  endOfDay 
} from "date-fns";
import { 
  FileDown, 
  Loader2, 
  ChevronDown, 
  Table, 
  FileSpreadsheet, 
  FileText 
} from "lucide-react"; 
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { ReportFilters } from "@/components/modules/analytics/ReportFilter";
import { EmptyChartPlaceholder } from "@/components/modules/analytics/sales/EmptyChartPlaceholder";
import { api } from "@/lib/sdk-config";
import { ExportFormat, useExport } from "@/hooks/export/use-export";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AverageTicketStat,
  GlobalStats,
  TotalSales,
  TotalTransactionsStat,
} from "@/components/modules/analytics/sales/SalesStats";
import SalesByHourChart from "@/components/modules/analytics/sales/SalesByHourChart";
import PaymentMethodPieChart from "@/components/modules/analytics/sales/PaymentMethodPieChart";
import CategorySalesDonutChart from "@/components/modules/analytics/sales/ServiceSalesDonutChart";
import TopBranchesChart from "@/components/modules/analytics/sales/TopBranchesChart";
import { DemographicSalesSection } from "@/components/modules/analytics/sales/DemographicSalesSection"; 

import { useBranches } from "@/hooks/branches/useBranches";
import { UserRole } from "@/lib/roles";

export default function SalesPage() {
  const t = useTranslations("analytics.Sales");
  const { token, user, hasRole } = useAuth();
  
  const { handleExport, isExporting } = useExport();

  const activeBranchId = user?.activeBranch?.id;
  const isGlobalAdmin = hasRole([UserRole.SUPER_ADMIN]);

  const [branchId, setBranchId] = useState<string>(() => user?.activeBranch?.id || "all");
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
  const hasValidRange = !!(startDate && endDate);
  const sDate = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
  const eDate = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

  const onExportSales = (formatType: ExportFormat) => {
    if (!sDate || !eDate) {
      toast.error(t("filters.required_title"));
      return;
    }

    const baseFileName = t("export_filename") || "Reporte_Ventas";

    handleExport(
      "sales-report",
      (jwt) => api.exports.exportSalesReport(jwt, sDate, eDate, selectedBranch, formatType),
      `${baseFileName}_${sDate}_to_${eDate}`,
      formatType
    );
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 p-6 md:p-10 space-y-8 pb-20 text-left">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actionButton={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                className="shadow-sm min-w-[160px]  text-white font-bold text-xs uppercase tracking-widest"
                disabled={isExporting === "sales-report" || !hasValidRange}
              >
                {isExporting === "sales-report" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                {isExporting === "sales-report" ? t("exporting") : t("export")}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onExportSales("csv")} className="cursor-pointer">
                <Table className="mr-2 h-4 w-4 text-slate-500" />
                <span>{t("formats.csv")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportSales("excel")} className="cursor-pointer">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                <span>{t("formats.excel")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportSales("pdf")} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                <span>{t("formats.pdf")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          onStartDateChange={(d) => { setStartDate(d); if(d) {
            setRange("custom");
          } }}
          onEndDateChange={(d) => { setEndDate(d); if(d) {
            setRange("custom");
          } }}
          loadingBranches={loadingBranches}
          onClear={() => {
            setBranchId(user?.activeBranch?.id || "all");
            setRange("this-month");
          }}
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <TotalSales token={token} />
        <GlobalStats token={token} />
        <AverageTicketStat token={token} branchId={selectedBranch} />
        <TotalTransactionsStat token={token} branchId={selectedBranch} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[400px] dark:bg-gray-800 rounded-2xl border border-slate-200/60 p-4 shadow-sm">
         <SalesByHourChart 
           token={token} 
           startHour="00:00" 
           endHour="23:59" 
         />
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <TopBranchesChart token={token} />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          {hasValidRange ? (
            <CategorySalesDonutChart token={token} startDate={sDate} endDate={eDate} />
          ) : (
            <EmptyChartPlaceholder 
              title={t("filters.required_title")} 
              description={t("filters.required_description")} 
            />
          )}
        </div>

        <div className="min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          {hasValidRange ? (
            <PaymentMethodPieChart token={token} startDate={sDate} endDate={eDate} />
          ) : (
            <EmptyChartPlaceholder 
              title={t("filters.required_title")} 
              description={t("filters.required_description")} 
            />
          )}
        </div>

        <div className="min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 p-4 shadow-sm">
           <DemographicSalesSection 
             token={token}
             branchId={selectedBranch}
             startDate={sDate}
             endDate={eDate}
           />
        </div>
      </section>
    </div>
  );
}