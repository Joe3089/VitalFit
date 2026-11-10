"use client";

import { useClientReport } from "@/hooks/reports/useClientReports";
import { CohortRetentionTable } from "./CohortRetentionTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  token: string | null;
  branchId?: string;
}

export function CohortAnalysisReport({ token, branchId }: Props) {
  const t = useTranslations("analytics.clients.cohort");
  const { data, isLoading, error } = useClientReport.useCohortAnalysis(token, branchId);

  if (isLoading) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="px-0">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-red-100 rounded-2xl bg-red-50/30 p-6 text-center">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <p className="text-sm text-red-800 font-semibold">{t("messages.error")}</p>
        <p className="text-xs text-red-500 mt-1 max-w-xs">
          Verifica tu conexión o intenta recargar la página.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-6 text-center">
        <p className="text-sm text-slate-500 font-medium italic">
          {t("messages.no_data")}
        </p>
      </div>
    );
  }
 
  return <CohortRetentionTable data={data} />;
}