"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { useClientReport } from "@/hooks/reports/useClientReports";

interface Props {
  token: string | null;
  branchId?: string;
}

export function NewVsRecurringReport({ token, branchId }: Props) {
  const t = useTranslations("analytics.clients.growth");
  

  const { data, isLoading } = useClientReport.useNewVsRecurringChart(token, branchId);


  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((item) => ({
      label: item.label,
      new: Number(item.new) || 0,
      recurring: Number(item.recurring) || 0,
    }));
  }, [data]);

  return (
    <StackedBarChart
      title={t("title")}
      description={t("description")}
      data={chartData} 
      isLoading={isLoading}
      indexKey="label" 
      series={[
        {
          key: "recurring",
          label: t("label_recurring"),
          color: "#3b82f6",  
        },
        {
          key: "new",
          label: t("label_new"),
          color: "#10b981",  
        },
      ]}
    />
  );
}