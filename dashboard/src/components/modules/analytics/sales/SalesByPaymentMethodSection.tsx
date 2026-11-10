"use client";

import { ReusablePieChart } from "@/components/charts/pie-chart";
import { ChartConfig } from "@/components/ui/chart";
import { useSalesByPaymentMethod } from "@/hooks/useReports";

export default function SalesByPaymentMethodSection({
  token,
  start,
  end,
}: {
  token: string;
  start: string;
  end: string;
}) {
  const { data, isLoading, error } = useSalesByPaymentMethod(token, start, end);

  if (isLoading) {
    return <p>Cargando...</p>;
  }
  if (error) {
    return <p>Error al cargar</p>;
  }
  if (!data) {
    return null;
  }

  const chartData = data.map((item) => ({
    label: item.label,
    value: Number(item.value),
  }));

  const chartConfig: ChartConfig = {
    PointOfSale: { label: "Point of Sale", color: "#4f46e5" },
    Cash: { label: "Cash", color: "#22c55e" },
    CreditCard: { label: "Credit Card", color: "#ec4899" },
    BankTransfer: { label: "Transfer", color: "#0ea5e9" },
    Zelle: { label: "Zelle", color: "#f59e0b" },
  };

  return (
    <ReusablePieChart
      title="Ventas por Método de Pago"
      description={`Distribución de pagos entre ${start} y ${end}`}
      data={chartData}
      dataKey="value"
      nameKey="label" 
      chartConfig={chartConfig} 
      footerText="Los porcentajes menores al 7% no se etiquetan directamente en el gráfico."
    />
  );
}
