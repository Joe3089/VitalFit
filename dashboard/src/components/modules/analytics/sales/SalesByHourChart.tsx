"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSalesReports } from "@/hooks/reports/useSalesReports";
import { BaseMultiChart } from "@/components/charts/BaseMultiChart";

type SalesByHourChartProps = {
  token: string;
  startHour: string;
  endHour: string;
};

export default function SalesByHourChart({
  token,
  startHour,
  endHour,
}: SalesByHourChartProps) {
  const t = useTranslations("analytics.Sales.charts.by_hour");
  
  const { data, isLoading } = useSalesReports.useSalesByHour(
    token,
    startHour,
    endHour
  );


  const description = t.rich("description", {
    start: startHour,
    end: endHour,
    strong: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>,
    strongNode: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>, 
  });
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)){
       return [];
    
    }
    return data.map((item: any, index: number) => {

      const hourValue = item.hour !== undefined ? item.hour : index;
      const formattedHour = `${hourValue.toString().padStart(2, "0")}:00`;

      const numericValue = typeof item.value === "string" 
        ? parseFloat(item.value.replace(/[^0-9.-]+/g, "")) 
        : item.value;

      return {
        ...item,
        hourLabel: formattedHour, 
        value: numericValue || 0,  
      };
    });
  }, [data]);

  return (
    <div className="w-full">
      <BaseMultiChart
        title={t("title")}
        description={description as any}
        data={chartData}
        isLoading={isLoading}
        indexKey="hourLabel" 
        valueType="currency"
        series={[
          { 
            key: "value", 
            label: t("series_label") || "Ventas", 
            color: "#f97316", 
            type: "line" 
          },
        ]}
      />
    </div>
  );
}