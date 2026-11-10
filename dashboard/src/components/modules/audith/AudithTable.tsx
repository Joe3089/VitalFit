"use client";

import { Column, DataTable } from "@/components/ui/table/DataTable";
import { AuditLog } from "@vitalfit/sdk";
import { Eye, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface AudithTableProps {
  data: any[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  onViewDetails: (log: AuditLog) => void;
  limit?: number;
}

export const getAuditColumns = (t: any): Column<any>[] => [
  {
    header: t("table.event"),
    accessor: "created_at",
    render: (value) => (
      <div className="flex items-center gap-2 py-1">
        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-medium text-foreground">
            {new Date(value as string).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
            })}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(value as string).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: t("table.method"),
    accessor: "method",
    render: (value) => {
      const method = String(value).toUpperCase();
      const variants: Record<string, string> = {
        GET: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
        POST: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
        PUT: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
        DELETE: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
      };

      return (
        <Badge
          variant="outline"
          className={`${variants[method] || "bg-gray-500/10 text-gray-600"} font-bold text-[10px] tracking-wider px-2 py-0 h-5`}
        >
          {t(`methods.${method.toLowerCase()}`)}
        </Badge>
      );
    },
  },
  {
    header: t("table.resource"),
    accessor: "displayPath", 
    render: (value) => (
      <div className="flex items-center gap-2 group">
        <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary transition-colors" />
        <code className="text-[12px] text-muted-foreground font-mono truncate max-w-[250px]">
          {value as string}
        </code>
      </div>
    ),
  },
  {
    header: t("table.status"),
    accessor: "status",
    render: (value) => {
      const status = value as number;
      const isError = status >= 400;
      return (
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${isError ? "bg-destructive" : "bg-emerald-500"}`}
          />
          <span
            className={`font-semibold text-xs ${isError ? "text-destructive" : "text-emerald-600"}`}
          >
            {status}
          </span>
        </div>
      );
    },
  },
  {
    header: t("table.origin"),
    accessor: "ip_address",
    render: (value) => (
      <div className="flex items-center gap-1.5 text-muted-foreground/80">
        <Globe className="h-3 w-3" />
        <span className="text-[11px] font-mono">{value as string}</span>
      </div>
    ),
  },
];

export default function AudithTable({
  data,
  isLoading,
  page,
  totalPages,
  setPage,
  onViewDetails,
  limit = 10,
}: AudithTableProps) {
  const t = useTranslations("user.audit");
  const columns = getAuditColumns(t);

  return (
    <div className="relative">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        enableRowSelection={false}
        actions={(row) => (
          <Button
            variant="ghost"
            size="icon"
            title={t("table.viewDetails")}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            onClick={() => onViewDetails(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />
    </div>
  );
}