"use client";

import React from "react";
import { RFMTreemap } from "./RFMTreemap"; 
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useClientReport } from "@/hooks/reports/useClientReports";

interface RFMTreemapReportProps {
  token: string;
  branchId?: string;
}

export const RFMTreemapReport: React.FC<RFMTreemapReportProps> = ({
  token,
  branchId,
}) => {
  const t = useTranslations("analytics.clients.rfm");
  const { data, isLoading } = useClientReport.useRfmAnalysis(token, branchId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed rounded-2xl">
        <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          {t("noDataTitle")}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
          {t("noDataDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <RFMTreemap 
        data={data} 
        title={t("title")}
        description={t("description")}
      />
      
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-gray-700">
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          {t("footer", { count: data.length })}
        </p>
      </div>
    </div>
  );
};