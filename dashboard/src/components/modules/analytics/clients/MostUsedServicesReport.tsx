"use client";

import { BaseMultiChart } from "@/components/charts/BaseMultiChart";
import { useClientReport } from "@/hooks/reports/useClientReports";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

interface Props {
  token: string | null;
  branchId?: string;
  startDate: string;
  endDate: string;
}

export function MostUsedServicesReport({ token, startDate, endDate }: Props) {
  const t = useTranslations("analytics.clients.services");  
  const { data, isLoading } = useClientReport.useMostUsedServices(token, startDate, endDate);


  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map((item: any) => ({
      serviceName: item.label,
      usageCount: parseInt(item.value, 10) || 0,
    }));
  }, [data]);

  return (
    <BaseMultiChart
      title={t("title")}
      description={t("description")} 
      data={chartData}
      isLoading={isLoading}
      indexKey="serviceName" 
      layout="vertical"      
      valueType="number"     
      series={[
        {
          key: "usageCount",
          label: t("label_usage"), 
          color: "#10b981",  
          type: "bar",
        },
      ]}
    />
  );
}