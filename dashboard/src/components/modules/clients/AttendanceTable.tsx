"use client";

import React, { useMemo } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { AttendanceHistory } from "@vitalfit/sdk";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceTableProps {
  data: AttendanceHistory[] | undefined; 
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AttendanceTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AttendanceTableProps) {
  const t = useTranslations("clients.AttendanceHistory.AttendanceTable");
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const attendanceColumns: Column<AttendanceHistory>[] = useMemo(
    () => [
      {
        header: t("columns.classService"),
        accessor: "class_name",
        render: (_, row) => (
          <div className="flex flex-col space-y-0.5 py-1 text-left">
            <span className="text-sm font-medium leading-none text-foreground">
              {row.class_name || t("placeholders.facilityUse")}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium italic">
              {row.service_name || t("placeholders.generalService")}
            </span>
          </div>
        ),
      },
      {
        header: t("columns.classTime"),
        accessor: "class_time",
        render: (val) => {
          if (!val) {
            return (
              <span className="text-muted-foreground/40 text-xs tracking-tight">
                {t("placeholders.notApplicable")}
              </span>
            );
          }
          const date = parseISO(val as string);
          return (
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-3 w-3 opacity-60" />
              <span className="text-xs font-medium tabular-nums">
                {format(date, "p", { locale: dateLocale })}
              </span>
            </div>
          );
        },
      },
      {
        header: t("columns.checkIn"),
        accessor: "check_in_time",
        render: (val) => {
          if (!val){
             return <span className="text-muted-foreground/30">—</span>;
          }
          const date = parseISO(val as string);

          return (
            <div className="flex items-center gap-4 py-1 text-left">
              <div className="flex flex-col items-center border-r pr-4 border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-widest">
                  {format(date, "MMM", { locale: dateLocale })}
                </span>
                <span className="text-base font-bold tabular-nums leading-none text-foreground">
                  {format(date, "dd")}
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-semibold capitalize text-foreground/80">
                  {format(date, "eeee", { locale: dateLocale })}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums flex items-center mt-0.5 font-medium">
                  <Clock className="mr-1 h-2.5 w-2.5 opacity-70" />
                  {format(date, "HH:mm:ss")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: t("columns.status"),
        accessor: "status",
        render: (value) => {
          const status = String(value);
          const statusConfig: Record<
            string,
            { label: string; className: string; dot: string }
          > = {
            Attended: {
              label: t("status.Attended"),
              className:
                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
              dot: "bg-emerald-500",
            },
            NoShow: {
              label: t("status.NoShow"),
              className:
                "bg-destructive/10 text-destructive border-destructive/20",
              dot: "bg-destructive",
            },
            Late: {
              label: t("status.Late"),
              className:
                "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
              dot: "bg-amber-500",
            },
          };

          const current = statusConfig[status] || {
            label: status,
            className:
              "bg-secondary text-secondary-foreground border-transparent",
            dot: "bg-muted-foreground",
          };

          return (
            <div
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-tight uppercase transition-all",
                current.className
              )}
            >
              <span
                className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", current.dot)}
              />
              {current.label}
            </div>
          );
        },
      },
    ],
    [t, dateLocale]
  );

  return (
    <div className="w-full">
      <DataTable
        columns={attendanceColumns}
        data={safeData}
        isLoading={isLoading}
        rowIdKey="attendance_id"
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        enableRowSelection={false}
      />
    </div>
  );
}