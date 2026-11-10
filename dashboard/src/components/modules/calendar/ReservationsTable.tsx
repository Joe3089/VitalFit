"use client";

import React from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserMinus, Loader2, Calendar as CalendarIcon, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";

interface ReservationsTableProps {
  data: any[];
  isLoading: boolean;
  onCancel: (id: string) => void;
  isProcessing: boolean;
  canManage: boolean;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function ReservationsTable({
  data,
  isLoading,
  total = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onCancel,
  isProcessing,
  canManage,
}: ReservationsTableProps) {
  const t = useTranslations("calendar.attendance_manager");
  
  // Cálculo seguro del total de páginas
  const totalPages = Math.ceil(total / pageSize) || 1;

  const columns: Column<any>[] = [
    {
      header: t("columns.student"),
      accessor: "first_name",
      render: (_, row) => (
        <div className="flex flex-col py-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 leading-none">
              {row.user_name || `${row.first_name} ${row.last_name}`}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-slate-500">
            <Mail className="w-3 h-3" />
            <span className="text-[11px] italic leading-none">
              {row.user_email || row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t("columns.booking_date"),
      accessor: "created_at",
      render: (value) => (
        <div className="flex items-center gap-2 text-slate-600">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium">
            {value ? format(parseISO(value as string), "dd/MM/yyyy HH:mm") : "---"}
          </span>
        </div>
      ),
    },
    {
      header: t("columns.status"),
      accessor: "status",
      render: () => (
        <Badge 
          variant="outline" 
          className="bg-orange-50 text-orange-700 border-orange-200 font-bold shadow-none uppercase text-[10px]"
        >
          {t("status.confirmed")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        rowIdKey="booking_id"
        // Valores por defecto para evitar que DataTable reciba undefined
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={onPageChange ?? (() => {})}
        actions={(row) => (
          <div className="flex justify-end gap-2 pr-4">
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                className="h-8 px-3 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg group"
                onClick={() => onCancel(row.booking_id)}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      {t("actions.cancel")}
                    </span>
                    <UserMinus className="w-4 h-4" />
                  </div>
                )}
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-slate-100 text-[9px] uppercase font-black">
                {t("labels.view_only")}
              </Badge>
            )}
          </div>
        )}
      />
    </div>
  );
}