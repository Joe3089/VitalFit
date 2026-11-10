"use client";

import React from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CalendarDays, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface AttendanceTableProps {
  data: any[];
  isLoading: boolean;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function AttendanceTable({
  data,
  isLoading,
  total = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
}: AttendanceTableProps) {
  const t = useTranslations("calendar.attendance_manager");
  const totalPages = Math.ceil(total / pageSize) || 1;

  const columns: Column<any>[] = [
    {
      header: t("columns.student"),
      accessor: "user_name",
      render: (value, row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-none">
              {value || row.first_name}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
              ID: {row.user_id?.substring(0, 8)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t("columns.service"),
      accessor: "service_name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{value}</span>
        </div>
      ),
    },
    {
      header: t("columns.check_in"),
      accessor: "check_in_time",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-medium text-slate-600">
            {value ? format(parseISO(value as string), "HH:mm 'hs'") : "---"}
          </span>
        </div>
      ),
    },
    {
      header: t("columns.status"),
      accessor: "status",
      render: (value) => {
        const status = value as string;
        const config: Record<string, { class: string; label: string; icon: any }> = {
          Attended: { 
            class: "bg-emerald-50 text-emerald-700 border-emerald-200", 
            label: t("status.attended"),
            icon: CheckCircle2 
          },
          Missed: { 
            class: "bg-red-50 text-red-700 border-red-200", 
            label: t("status.missed"),
            icon: XCircle 
          },
          CancelledByUser: { 
            class: "bg-slate-100 text-slate-500 border-slate-200", 
            label: t("status.cancelled"),
            icon: AlertCircle 
          },
        };

        const current = config[status] || { class: "bg-slate-50", label: status, icon: Clock };
        const Icon = current.icon;

        return (
          <Badge variant="outline" className={cn("font-bold shadow-none gap-1.5 py-0.5 uppercase text-[10px]", current.class)}>
            <Icon className="w-3 h-3" />
            {current.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        rowIdKey="attendance_id"
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={onPageChange ?? (() => {})}
      />
    </div>
  );
}