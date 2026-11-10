"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { useTranslations, useLocale } from "next-intl"; 

interface FinancialSummaryCardProps {
  token: string | null;
  branchId?: string;
}

export const FinancialSummaryCard = ({
  token,
  branchId,
}: FinancialSummaryCardProps) => {

  const t = useTranslations("analytics.finance.financial_summary");
  const locale = useLocale();

  const { data: response, isLoading } = useBranchReport.useFinancialSummary(
    token,
    branchId
  );

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency: "USD",
      }),
    [locale]
  );

  const financialData = response;

  return (
    <Card className="shadow-sm border-l-4 border-l-emerald-500 h-full bg-white dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <Skeleton className="h-16 w-full rounded-lg mt-4" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {financialData?.items.map((item, index) => (
                <div
                  key={item.category}
                  className={`flex items-center justify-between ${index !== 0 ? "border-t pt-4" : ""}`}
                >
                  <span className="text-sm text-muted-foreground capitalize">
                    {item.category.toLowerCase()}
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatter.format(Number(item.amount))}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {t("total_net")}
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatter.format(Number(financialData?.total || "0"))}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
