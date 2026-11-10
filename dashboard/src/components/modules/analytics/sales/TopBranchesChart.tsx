"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSalesReports } from "@/hooks/reports/useSalesReports";
import { BaseMultiChart } from "@/components/charts/BaseMultiChart";

type TopBranchesChartProps = {
  token: string;
};

export default function TopBranchesChart({ token }: TopBranchesChartProps) {
  const t = useTranslations("analytics.Sales.charts.top_branches");

  const { data, isLoading } = useSalesReports.useTopBranches(token);

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)){
       return [];
    }

    return data.map((item) => ({
      ...item,

      value: Number(item.value) || 0,
      fill: item.status === "Attention" || item.trend === "down" ? "#ef4444" : "#3b82f6"
    }));
  }, [data]);

  const branchCount = data?.length || 0;

  return (
    <div className="h-full ">
      <BaseMultiChart
        title={t("title")}
       description={t("description", { count: branchCount })}
        data={chartData}
        isLoading={isLoading}
        indexKey="label"
        layout="vertical" 
        valueType="currency"
        series={[
          { 
            key: "value", 
            label: t("sales_label"), 
            color: "#3b82f6", 
            type: "bar" 
          },
        ]}
      />
    </div>
  );
}