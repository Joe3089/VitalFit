"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ReusablePieChart } from "@/components/charts/pie-chart";
import { useSalesReports } from "@/hooks/reports/useSalesReports";
import { ChartConfig } from "@/components/ui/chart";
import { CalendarIcon, MousePointerClick } from "lucide-react";

type PaymentMethodPieChartProps = {
  token: string;
  startDate?: string;
  endDate?: string;
};

const PAYMENT_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8"];

export default function PaymentMethodPieChart({
  token,
  startDate = "",
  endDate = "",
}: PaymentMethodPieChartProps) {
  const t = useTranslations("analytics.Sales.charts.payment_method");

  const hasFilters = Boolean(startDate && endDate);

  const { data, isLoading } = useSalesReports.useSalesByPaymentMethod(
    token,
    startDate,
    endDate
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: { label: t("amount") || "Monto" },
    };

    data?.forEach((item, index) => {
      config[item.label] = {
        label: item.label,
        color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
      };
    });

    return config;
  }, [data, t]);

  if (!hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full mb-4">
          <CalendarIcon className="h-6 w-6 text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t("filters_required_title") || "Filtros requeridos"}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
          {t("filters_required_description") || "Selecciona un rango de fechas para visualizar los métodos de pago."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReusablePieChart
        title={t("title")}
        description={t("description")}
        data={data}
        isLoading={isLoading}
        dataKey="value"
        nameKey="label"
        chartConfig={chartConfig}
        colors={PAYMENT_COLORS}
        footerText={t("footer_text", { count: data?.length || 0 })}
        valuePrefix="$" 
      />
    </div>
  );
}