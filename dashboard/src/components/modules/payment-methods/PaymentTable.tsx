"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { RefreshCcw, Eye, Pencil, Trash2 } from "lucide-react";

import { PaymentMethod } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";


interface PaymentTableProps {
  data: PaymentMethod[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    setPage: (p: number) => void;
  };
  filters: { type: string; search: string };
  setFilters: (f: any) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  onRefresh: () => void;
}

export default function PaymentTable({
  data,
  loading,
  pagination,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  onRefresh,
}: PaymentTableProps) {
  const t = useTranslations("catalog.payment_methods");
  const router = useRouter();
  const { token } = useAuth();

  const [deleteRow, setDeleteRow] = useState<PaymentMethod | null>(null);

  const handleDelete = async () => {
    if (!token || !deleteRow){
       return;
    }

    try {
      await api.paymentMethod.deletePaymentMethod(deleteRow.method_id, token);
      toast.success(t("notifications.delete_success"));
      setDeleteRow(null);
      onRefresh();
    } catch (error) {
      toast.error(t("notifications.delete_error"));
    }
  };

  const columns: Column<PaymentMethod>[] = [
    {
      header: t("table.columns.name"),
      accessor: "name",
      render: (_, row) => (
        <div className="flex flex-col min-w-[150px]">
          <span className="font-medium text-sm truncate">{String(row.name)}</span>
          <span className="text-[10px] text-muted-foreground font-mono hidden md:block">
            {row.method_id.split("-")[0]}...
          </span>
        </div>
      ),
    },
    {
      header: t("table.columns.type"),
      accessor: "type",
      render: (type) => {
        const typeKey = String(type).toLowerCase();
        const variantMap: Record<string, "info" | "secondary" | "warning" | "outline"> = {
          transfer: "info",
          cash: "warning",
          card: "secondary",
          other: "outline",
        };

        return (
          <Badge variant={variantMap[typeKey] || "secondary"} className="uppercase text-[10px] whitespace-nowrap">
            {t(`table.types.${typeKey}`)}
          </Badge>
        );
      },
    },
    {
      header: t("table.columns.status"),
      accessor: "global_status" as any,
      render: (status) => {
        const isActive = status !== false;
        return (
          <Badge variant={isActive ? "success" : "error"} className="whitespace-nowrap">
            {isActive ? t("table.status.active") : t("table.status.inactive")}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-1 gap-4 items-center">
          <div className="relative w-full sm:max-w-[300px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.filter_placeholder")}
              className="pl-9 h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={filters.type || "all"}
            onValueChange={(v) =>
              setFilters({ ...filters, type: v === "all" ? "" : v })
            }
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder={t("table.all_types")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("table.all_types")}</SelectItem>
              <SelectItem value="Cash">{t("table.types.cash")}</SelectItem>
              <SelectItem value="Card">{t("table.types.card")}</SelectItem>
              <SelectItem value="Transfer">{t("table.types.transfer")}</SelectItem>
              <SelectItem value="Other">{t("table.types.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-10 w-full lg:w-auto"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("table.update_button")}
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable<PaymentMethod>
            columns={columns}
            data={data}
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            isLoading={loading}
            rowIdKey="method_id"
            actions={(row) => (
              <RowActions
                actions={[
                  {
                    label: t("table.actions.view"),
                    icon: Eye,
                    onClick: () =>
                      router.push(`/catalog/payment-methods/${row.method_id}`),
                  },
                  {
                    label: t("table.actions.edit"),
                    icon: Pencil,
                    onClick: () =>
                      router.push(`/catalog/payment-methods/${row.method_id}/edit`),
                  },
                  {
                    label: t("table.actions.delete"),
                    icon: Trash2,
                    onClick: () => setDeleteRow(row),
                    variant: "danger",
                    separatorBefore: true,
                  },
                ]}
              />
            )}
          />
        </div>
      </div>

      <GeneralAlertDialog
        open={Boolean(deleteRow)}
        onOpenChange={(open) => !open && setDeleteRow(null)}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description", { name: deleteRow?.name ?? "" })}
        actionText={t("table.delete_dialog.action_delete")}
        onAction={handleDelete}
        actionVariant="destructive"
      />
    </>
  );
}