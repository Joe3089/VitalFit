"use client";

import { useMemo } from "react";
import { BaseMultiChart } from "@/components/charts/BaseMultiChart";
import { useFinanceReports } from "@/hooks/reports/useFinanceReports";
import { useTranslations } from "next-intl";

export function MonthlyRevenueReport({ token, branchId }: { token: string; branchId?: string }) {
  const t = useTranslations("analytics.finance.charts.monthly_revenue");
  
  const { data: rawResponse, isLoading } = useFinanceReports.useMonthlyRevenueChart(token, branchId);

  const chartData = useMemo(() => {
    if (!rawResponse || !Array.isArray(rawResponse)) {
      return [];
    }
    
    return rawResponse.map((item: any) => ({
      name: item.label,         
      valor: Number(item.value)
    }));
  }, [rawResponse]);

  const seriesConfig = [
    {
      key: "valor",
      label: t("series_label"), 
      color: "#3b82f6", 
      type: "line" as const, 
    },
  ];

  return (
    <BaseMultiChart
      title={t("title")}
      description={t("description")}
      data={chartData}
      series={seriesConfig}
      indexKey="name"         
      isLoading={isLoading}
      valueType="currency"   
    />
  );
}