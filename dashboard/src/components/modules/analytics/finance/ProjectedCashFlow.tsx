"use client";

import { BaseMultiChart } from "@/components/charts/BaseMultiChart";
import { useFinanceReports } from "@/hooks/reports/useFinanceReports";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function ProjectedCashFlowReport({ token, branchId }: { token: string; branchId?: string }) {
  const t = useTranslations("analytics.finance.charts.cash_flow");
  
  const { data: rawResponse, isLoading } = useFinanceReports.useMonthlyCashFlow(token, branchId);

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
      color: "#4ade80", 
      type: "bar" as const,
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