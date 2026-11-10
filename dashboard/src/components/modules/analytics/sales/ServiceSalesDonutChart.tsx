"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSalesReports } from "@/hooks/reports/useSalesReports";
import { ChartConfig } from "@/components/ui/chart";
import { ReusableDonutChart } from "@/components/charts/donut-chart";

type CategorySalesDonutChartProps = {
  startDate?: string;
  endDate?: string;
  token: string;
};

const CATEGORY_COLORS = ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];

export default function CategorySalesDonutChart({
  startDate = "",
  endDate = "",
  token,
}: CategorySalesDonutChartProps) {
  const t = useTranslations("analytics.Sales.charts.category_sales");

  const { data, isLoading } = useSalesReports.useSalesByCategory(
    token,
    startDate,
    endDate
  );

  // Aseguramos que data sea un array antes de procesarlo
  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: { label: t("value_label") || "Sales" },
    };

    // Ahora usamos safeData que garantizamos es un array
    safeData.forEach((item: any, index: number) => {
      if (item?.label) {
        config[item.label] = {
          label: item.label,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        };
      }
    });

    return config;
  }, [safeData, t]);

  const totalAmount = useMemo(() => 
    safeData.reduce((acc, item: any) => acc + (Number(item?.value) || 0), 0), 
    [safeData]
  );

  return (
    <div className="h-full">
      <ReusableDonutChart
        title={t("title")}
        description={t("description")}
        data={safeData}
        isLoading={isLoading}
        dataKey="value"
        labelKey="label"
        config={chartConfig}
        footerText={t("footer_total", { 
          count: safeData.length,
          total: new Intl.NumberFormat("en-US", { 
            style: "currency", 
            currency: "USD" 
          }).format(totalAmount)
        })}
        growth={undefined} 
        height={300}
      />
    </div>
  );
}