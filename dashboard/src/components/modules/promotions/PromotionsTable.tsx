"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Download, Eye, Pencil, Trash2, Search, X } from "lucide-react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Promotion } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { useTranslations } from "next-intl";

interface PromotionsTableProps {
  data: Promotion[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onFilterChange: (key: string, value: string | undefined) => void;
  filterValues: Record<string, string | undefined>;
  onReload: () => void;
}

export default function PromotionsTable({
  data,
  isLoading,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  onReload,
  filterValues,
}: PromotionsTableProps) {
  
  const t = useTranslations("catalog.Promotions.table");
  const tActions = useTranslations("catalog.Promotions.actions");
  
  const { token } = useAuth();
  const router = useRouter();
  
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const [inputFilters, setInputFilters] = useState<Record<string, string>>({
    search: filterValues.search || "",
  });

  const columns: Column<Promotion>[] = [
    {
      header: t("columns.promotion"),
      accessor: "name",
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm text-slate-900 leading-none">{value}</span>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            {row.code}
          </span>
        </div>
      ),
    },
    {
      header: t("columns.benefit"),
      accessor: "discount_value",
      render: (_, row) => (
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-slate-800">
            {row.discount_type === "Percentage"
              ? `${row.discount_value}%`
              : `$${row.discount_value.toLocaleString()}`}
          </span>
          <span className="text-[10px] font-medium text-slate-400 uppercase">Off</span>
        </div>
      ),
    },
    {
      header: t("columns.validity"),
      accessor: "start_date",
      render: (_, row) => {
        const formatDate = (dateStr: string) =>
          new Date(dateStr).toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "short",
          });

        return (
          <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md w-fit border border-slate-100 font-medium">
            <span>{formatDate(row.start_date)}</span>
            <span className="mx-2 text-slate-300">—</span>
            <span>{formatDate(row.end_date)}</span>
          </div>
        );
      },
    },
    {
      header: t("columns.status"),
      accessor: "is_active",
      render: (isActive, row) => {
        const now = new Date();
        const isExpired = new Date(row.end_date) < now;

        if (!isActive) {
          return <Badge variant="secondary">{t("status.inactive")}</Badge>;
        }
        if (isExpired) {
          return <Badge variant="warning">{t("status.expired")}</Badge>;
        }
        return <Badge variant="success">{t("status.active")}</Badge>;
      },
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange("search", inputFilters.search || undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputFilters.search]);

  const clearFilters = () => {
    setInputFilters({ search: "" });
    onFilterChange("search", undefined);
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) {
      return;
    }

    const toastId = toast.loading(tActions("delete_loading"));
    try {
      await api.marketing.deletePromotion(deleteTarget.promotion_id, token);
      toast.success(tActions("delete_success"), { id: toastId });
      onReload();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || tActions("delete_error"), { id: toastId });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("filters.search_placeholder")}
                className="pl-9 h-10"
                value={inputFilters.search}
                onChange={(e) => setInputFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {inputFilters.search && (
              <Button variant="ghost" onClick={clearFilters} className="h-10 text-muted-foreground">
                <X className="mr-2 h-4 w-4" />
                {t("filters.clear")}
              </Button>
            )}
          </div>

          <Button variant="outline" className="h-10">
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          totalPages={totalPages}
          rowIdKey="promotion_id"
          actions={(row) => (
            <RowActions
              actions={[
                { 
                  label: tActions("view"), 
                  icon: Eye, 
                  onClick: () => router.push(`/marketing/promotions/${row.promotion_id}`) 
                },
                { 
                  label: tActions("edit"), 
                  icon: Pencil, 
                  onClick: () => router.push(`/marketing/promotions/${row.promotion_id}/edit`) 
                },
                {
                  label: tActions("delete"),
                  icon: Trash2,
                  onClick: () => setDeleteTarget(row),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />
          )}
        />
      </div>

      <GeneralAlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("delete_dialog.title")}
        description={t("delete_dialog.description", { name: deleteTarget?.name ?? "" })}
        actionText={t("delete_dialog.confirm")}
        cancelText={t("delete_dialog.cancel")}
        onAction={handleDelete}
        actionVariant="destructive"
      />
    </>
  );
}