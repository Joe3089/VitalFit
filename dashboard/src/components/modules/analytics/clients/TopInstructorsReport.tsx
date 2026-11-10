"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { RadialRankingChart } from "@/components/charts/RadialRankingChart";
import { useClientReport } from "@/hooks/reports/useClientReports";

interface TopInstructorsProps {
  token: string | null;
  branchId?: string;
  startDate: string;
  endDate: string;
}


const RANK_COLORS = [
  "#f97316", 
  "#fb923c", 
  "#fdba74", 
  "#fed7aa", 
  "#ffedd5",
];

export function TopInstructorsReport({ token, startDate, endDate }: TopInstructorsProps) {
  const t = useTranslations("analytics.clients.instructors");

  const { data, isLoading } = useClientReport.useTopInstructorsByAttendance(
    token, 
    startDate, 
    endDate
  );

  const isDateRangeMissing = !startDate || !endDate;

  const formattedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    };

    return data
      .slice(0, 5) 
      .map((item: any, index: number) => ({
        name: item.label,
        value: item.value, 
        fill: RANK_COLORS[index] || RANK_COLORS[4],
      }))
      .reverse(); 
  }, [data]);

  if (isDateRangeMissing) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed rounded-xl bg-slate-50/50">
        <p className="text-sm text-slate-500 font-medium italic">
          {t("messages.select_dates")}
        </p>
      </div>
    );
  }

  return (
    <RadialRankingChart
      title={t("title")}
      description={t("description")}
      data={formattedData}
      isLoading={isLoading}
    />
  );
}