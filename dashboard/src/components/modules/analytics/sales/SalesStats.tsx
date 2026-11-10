"use client";

import { useMemo } from "react";
import { DollarSign, Hash, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSalesReports } from "@/hooks/reports/useSalesReports";
import { ReportStatItem } from "../ReportStatItem";
import { StatCard } from "@/components/ui/StatCard";

interface StatProps {
  token: string | null;
  branchId?: string | undefined;
}

interface GlobalStatsData {
  total_current_month: string;
  total_last_month: string;
  percentage_change: number;
  trend: string;
}

export function TotalSales({ token }: StatProps) {
  const t = useTranslations("analytics.Sales.stats");
  const { data, isLoading } = useSalesReports.useTotalSales(token);

  const mappedData = useMemo(() => {
    if (!data) {
      return null;
    }
    return {
      value: data.total_sales || 0,
      percentage_change: data.percentage_change,
      trend: data.trend,
      title: t("total_sales"),
    };
  }, [data, t]);

  return (
    <ReportStatItem
      data={mappedData}
      isLoading={isLoading}
      defaultTitle={t("total_sales")}
      icon={DollarSign}
      formatType="currency"
    />
  );
}

export function AverageTicketStat({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.Sales.stats");
  const { data, isLoading } = useSalesReports.useAverageTicket(token, branchId);

  return (
    <ReportStatItem
      data={data}
      isLoading={isLoading}
      defaultTitle={t("average_ticket")}
      icon={TrendingUp}
      formatType="currency" 
    />
  );
}

export function TotalTransactionsStat({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.Sales.stats");
  const { data, isLoading } = useSalesReports.useTotalTransactionsKPI(
    token,
    branchId
  );

  return (
    <ReportStatItem
      data={data}
      isLoading={isLoading}
      defaultTitle={t("total_transactions")} 
      icon={Hash}
      formatType="number"
    />
  );
}

export function GlobalStats({ token }: { token: string }) {
  const t = useTranslations("analytics.Sales");
  const { data, isLoading } = useSalesReports.useGlobalStats(token);

  const stats = useMemo(() => {
    if (!data) {
      return null;
    }
    
    const raw = (data as unknown) as GlobalStatsData;

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    const trendNumeric = typeof raw.percentage_change === "number" 
      ? raw.percentage_change 
      : parseFloat(raw.percentage_change || "0");

    return {
      displayValue: formatter.format(parseFloat(raw.total_current_month) || 0),
      trendValue: `${trendNumeric.toFixed(1)}%`,
      isPositive: raw.trend === "up",
    };
  }, [data]);

  return (
    <StatCard
      title={t("stats.monthly_sales")}
      isLoading={isLoading}
      value={isLoading ? "..." : stats?.displayValue || "$0.00"}
      icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      trend={
        stats
          ? {
              value: stats.trendValue,
              isPositive: stats.isPositive,
              label: t("stats.comparison"), 
            }
          : undefined
      }
    />
  );
}