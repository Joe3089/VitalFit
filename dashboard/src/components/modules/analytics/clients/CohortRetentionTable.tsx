"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRetentionColor } from "@/utils/heatmap";
import { addMonths, isAfter, startOfMonth } from "date-fns";

interface CohortRow {
  cohort_month: string; 
  cohort_size: number;
  retention: number[];
}

export function CohortRetentionTable({ data }: { data: CohortRow[] }) {
  const t = useTranslations("analytics.clients.cohort");
  const locale = useLocale();
  const today = startOfMonth(new Date());

  const formatCohortDate = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
  };

  const monthHeaders = Array.from({ length: 13 }, (_, i) => 
    t("table.retention_month", { n: i })
  );

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-bold text-slate-800">{t("title")}</CardTitle>
        <CardDescription className="text-xs">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-xl border border-slate-100 overflow-hidden overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-[140px] font-bold text-slate-900 border-r bg-slate-50/30 sticky left-0 z-20">
                  {t("table.month")}
                </TableHead>
                <TableHead className="w-[80px] font-bold text-center text-slate-900 border-r bg-slate-50/30">
                  {t("table.size")}
                </TableHead>
                {monthHeaders.map((header, idx) => (
                  <TableHead key={idx} className="text-center font-semibold text-[11px] text-slate-500 min-w-[70px] uppercase">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const [year, month] = row.cohort_month.split("-");
                const cohortStartDate = new Date(parseInt(year), parseInt(month) - 1);

                return (
                  <TableRow key={row.cohort_month} className="hover:bg-transparent border-b-slate-50">
                    <TableCell className="font-bold text-slate-700 bg-white sticky left-0 z-10 border-r uppercase text-[10px] tracking-tighter">
                      {formatCohortDate(row.cohort_month)}
                    </TableCell>
                    <TableCell className="text-center font-semibold bg-slate-50/20 border-r text-slate-600 tabular-nums">
                      {row.cohort_size}
                    </TableCell>
                    
                    {row.retention.map((rate, i) => {
                      const targetDate = addMonths(cohortStartDate, i);
                      const isFuture = isAfter(targetDate, today);

                      return (
                        <TableCell
                          key={`${row.cohort_month}-m${i}`}
                          className={cn(
                            "text-center text-[11px] p-0 h-12 border-[0.5px] border-white transition-all font-medium",
                            isFuture ? "bg-slate-50/30 text-slate-300" : getRetentionColor(rate)
                          )}
                        >
                          {isFuture ? "—" : `${rate}%`}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}