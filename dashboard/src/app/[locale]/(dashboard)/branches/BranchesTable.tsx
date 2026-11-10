"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { PaginatedBranch } from "@vitalfit/sdk";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {  Eye, Pencil, Search, Trash2 } from "lucide-react";
import { RowActions } from "@/components/ui/table/RowActions";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog"; 
import { toast } from "sonner"; 

export type FilterChangeHandler = (key: string, value: string | undefined) => void;

interface BranchesTableProps {
  data: PaginatedBranch[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalPages: number;
  onFilterChange: FilterChangeHandler;
  filterValues: Record<string, string | undefined>;
  onBranchDeleted?: () => void | Promise<void>;
}

interface BranchRow {
  branch_id: string;
  name: string;
}

export default function BranchesTable({
  data,
  isLoading,
  onFilterChange,
  filterValues,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onBranchDeleted,
}: BranchesTableProps) {
  const t = useTranslations("branches");
  const { token } = useAuth();
  const router = useRouter();

  const [inputFilters, setInputFilters] = useState<Record<string, string>>({});
  const [pendingRow, setPendingRow] = useState<BranchRow | null>(null);

  const handleView = (row: BranchRow) => router.replace(`/branches/${row.branch_id}`);
  const handleEdit = (row: BranchRow) => router.replace(`/branches/${row.branch_id}/edit`);

  const confirmDelete = (row: BranchRow) => {
    setPendingRow(row);
  };

  const handleDelete = async () => {
    if (!pendingRow || !token) {
      return;
    }

    try {
      await api.branch.delete(pendingRow.branch_id, token);
      toast.success(t("table.delete_dialog.success", { name: pendingRow.name }));
      if (onBranchDeleted){
         onBranchDeleted();
      }
    } catch (error) {
      toast.error(t("table.delete_dialog.error"));
      console.error(error);
    } finally {
      setPendingRow(null);
    }
  };

  const columns: Column<PaginatedBranch>[] = [
    { accessor: "name", header: t("table.columns.name") },
    { header: t("table.columns.tax_id"), accessor: "tax_id" },
    {
      header: t("table.columns.manager"),
      accessor: "manager_name",
      render: (_, row) => `${row.manager_name} ${row.manager_last_name}`,
    },
    { header: t("table.columns.country"), accessor: "country_name" },
    {
      accessor: "status",
      header: t("table.columns.status"),
      render: (value) => {
        const statusConfig = {
          Active: { text: t("table.status.active"), color: "text-green-700 border-green-300" },
          Inactive: { text: t("table.status.inactive"), color: "text-red-700 border-red-300" },
          Maintenance: { text: t("table.status.maintenance"), color: "text-yellow-700 border-yellow-300" },
        };
        const config = statusConfig[value as keyof typeof statusConfig] ?? {
          text: t("table.status.unknown"),
          color: "bg-gray-100 text-gray-700 border-gray-300",
        };
        return (
          <Badge variant="outline" className={`border ${config.color}`}>
            {config.text}
          </Badge>
        );
      },
    },
  ];
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange?.("name", inputFilters.search || undefined);
      onFilterChange?.("tax_id", inputFilters.search || undefined);
      onFilterChange?.("status", inputFilters.status || undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputFilters]);

  return (
    <>
      {/* Selector de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.placeholder")}
            className="pl-9"
            value={inputFilters.search || ""}
            onChange={(e) => setInputFilters((p) => ({ ...p, search: e.target.value }))}
          />
        </div>
        
        <Select
          value={inputFilters.status || ""}
          onValueChange={(value) => setInputFilters((p) => ({ ...p, status: value }))}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("table.filter_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">{t("table.status.active")}</SelectItem>
            <SelectItem value="Inactive">{t("table.status.inactive")}</SelectItem>
            <SelectItem value="Maintenance">{t("table.status.maintenance")}</SelectItem>
          </SelectContent>
        </Select>

        {(filterValues.name || filterValues.status) && (
          <Button
            variant="ghost"
            onClick={() => {
              onFilterChange("name", undefined);
              onFilterChange("tax_id", undefined);
              onFilterChange("status", undefined);
              setInputFilters({});
            }}
          >
            {t("table.clear_filters")}
          </Button>
        )}

      </div>

      <GeneralAlertDialog
        open={!!pendingRow}
        onOpenChange={(isOpen) => !isOpen && setPendingRow(null)}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        actionText={t("table.delete_dialog.confirm")}
        cancelText={t("table.delete_dialog.cancel")}
        onAction={handleDelete}
        actionVariant="destructive"
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        totalPages={totalPages}
        rowIdKey="branch_id"
        actions={(row) => (
          <RowActions
            actions={[
              { label: t("table.actions.view"), icon: Eye, onClick: () => handleView(row) },
              { label: t("table.actions.edit"), icon: Pencil, onClick: () => handleEdit(row) },
              {
                label: t("table.actions.delete"),
                icon: Trash2,
                onClick: () => confirmDelete(row),
                variant: "danger",
                separatorBefore: true,
              },
            ]}
          />
        )}
      />
    </>
  );
}