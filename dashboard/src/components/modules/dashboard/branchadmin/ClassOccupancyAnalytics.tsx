"use client";

import React, { useMemo } from "react";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { BaseMultiChart } from "@/components/charts/BaseMultiChart";
import { useTranslations } from "next-intl";

interface ClassOccupancyAnalyticsProps {
  token: string | null;
  branchId?: string;
}

export function ClassOccupancyAnalytics({
  token,
  branchId,
}: ClassOccupancyAnalyticsProps) {
  const t = useTranslations("analytics.branch.Occupancy.class_analytics");
    
  const { data, isLoading } = useBranchReport.useClassOccupancyChart(
    token,
    branchId
  );

  const formattedData = useMemo(() => {
    const rawData = data || [];

    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData.map((item: any) => ({
      name: item.label.split("(")[0].trim(),
      ocupacion: Number(item.value),
    }));
  }, [data]);

  const seriesConfig = useMemo(() => [
    {
      key: "ocupacion",
      label: t("series_label"),
      color: "hsl(var(--primary))",
      type: "bar" as const,
    },
  ], [t]);

  return (
    <div className="h-full">
      <BaseMultiChart
        title={t("title")}
        description={t("description")}
        data={formattedData}
        series={seriesConfig}
        indexKey="name"
        isLoading={isLoading}
        layout="vertical"
        valueType="number"
      />
    </div>
  );
}
