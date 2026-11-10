"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { toast } from "sonner";
import { User } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export type UserTableProps = {
  data: User[];
  isLoading: boolean;
  onReload: () => void;
  filters: { search?: string; role?: string };
  onFilterChange: (filters: { search?: string; role?: string }) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function UsersTable({
  data,
  isLoading,
  onReload,
  filters,
  onFilterChange,
  page,
  totalPages,
  onPageChange,
}: UserTableProps) {
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("user.management");
  const tRoles = useTranslations("user.UserSelectionCard.roles");


  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleDeleteUser = async () => {
    if (!token || !deleteRowId) {
      return;
    }
    const toastId = toast.loading(t("notifications.delete_loading"));

    try {
      await api.user.deleteUser(deleteRowId, token);
      toast.success(t("notifications.delete_success"), {
        id: toastId,
      });
      onReload();
    } catch (error) {
      toast.error(t("notifications.error_delete"), {
        id: toastId,
      });
    } finally {
      setDeleteRowId(null);
    }

  };

  const columns: Column<User>[] = [
    {
      header: t("table.columns.name"),
      accessor: "first_name",
      render: (_, row) => `${row.first_name} ${row.last_name}`,
    },
    { header: t("table.columns.email"), accessor: "email" },
    {
      header: t("table.columns.role"),
      accessor: "role_name" as keyof User,
      render: (value) => (
        <Badge variant="secondary" className="font-normal text-xs">
          {tRoles(String(value).toLowerCase()) || String(value)}
        </Badge>
      )
    },
    {
      header: t("table.columns.status"),
      accessor: "is_validated",
      render: (value) =>
        value ? (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs">{t("table.columns.status_active")}</Badge>
        ) : (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-xs">{t("table.columns.status_inactive")}</Badge>
        ),
    },
  ];


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full sm:w-[350px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.filters.search_placeholder")}
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <Select
            value={filters.role || "all"}
            onValueChange={(value) =>
              onFilterChange({ ...filters, role: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("table.filters.role_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("table.filters.all_roles")}</SelectItem>
              <SelectItem value="super_admin">{tRoles("super_admin")}</SelectItem>
              <SelectItem value="branch_admin">{tRoles("branch_admin")}</SelectItem>
              <SelectItem value="instructor">{tRoles("instructor")}</SelectItem>
              <SelectItem value="accountant">{tRoles("accountant")}</SelectItem>
              <SelectItem value="data_analyst">{tRoles("data_analyst")}</SelectItem>
              <SelectItem value="recepcionist">{tRoles("recepcionist")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      <DataTable<User>
        key={`users-table-page-${page}`}
        columns={columns}
        data={data}
        isLoading={isLoading}
        rowIdKey="user_id"
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        actions={(row) => (
          <RowActions
            actions={[
              { label: t("table.actions.view"), icon: Eye, onClick: () => router.push(`/users/users/${row.user_id}`) },
              { label: t("table.actions.edit"), icon: Pencil, onClick: () => router.push(`/users/users/${row.user_id}/edit`) },
              {
                label: t("table.actions.delete"),
                icon: Trash2,
                onClick: () => setDeleteRowId(row.user_id),
                variant: "danger",
                separatorBefore: true,
              },
            ]}
          />
        )}

      />

      <GeneralAlertDialog
        open={!!deleteRowId}
        onOpenChange={(open) => !open && setDeleteRowId(null)}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        actionText={t("table.delete_dialog.confirm")}
        onAction={handleDeleteUser}
        actionVariant="destructive"
      />

    </div>
  );
}