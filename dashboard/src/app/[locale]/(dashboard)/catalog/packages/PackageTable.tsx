"use client";
import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  ArrowDownTrayIcon as ArrowDownTray,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { PackageListItem } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";

interface PackageTableProps {
  data: PackageListItem[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string };
  onFilterChange: (filters: { search?: string }) => void;
}

export default function PackageTable({
  data,
  onReload,
  page,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: PackageTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  const [pendingRow, setPendingRow] = useState<string | null>(null);

  const { token } = useAuth();
  const router = useRouter();
  const t = useTranslations("catalog.packages");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() === "") {
        if (filters.search !== "") {
          onFilterChange({ search: "" });
        }
      } else if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleView = (row: PackageListItem) => {
    if (!row.packageId) {
      console.error("packageId no disponible en esta fila", row);
      return;
    }
    router.push(`/catalog/packages/${row.packageId}`);
  };

  const handleEdit = (row: PackageListItem) => {
    router.push(`/catalog/packages/${row.packageId}/edit`);
  };

  const handleDelete = async (pkg: PackageListItem) => {
    const pkgId = pkg.packageId;

    if (!pkgId) {
      toast.error(t("notifications.invalid_id"));
      setDeleteRowId(null);
      return;
    }

    if (!token) {
      toast.error(t("notifications.auth_error"));
      setDeleteRowId(null);
      return;
    }

    setPendingRow(pkgId);

    try {
      await api.packages.deletePackage(pkgId, token);
      toast.success(t("notifications.delete_success"));
      onReload();
    } catch (error) {
      console.error("Error al eliminar el paquete:", error);
      toast.error(t("notifications.delete_error"));
    } finally {
      setDeleteRowId(null);
      setPendingRow(null);
    }
  };

  const columns: Column<PackageListItem>[] = [
    { header: t("table.columns.name"), accessor: "name" },
    { header: t("table.columns.description"), accessor: "description" },
    {
      header: t("table.columns.duration"),
      accessor: "endAt",
      render: (_value, row) => {
        const start = row.startAt ? new Date(row.startAt) : null;
        const end = row.endAt ? new Date(row.endAt) : null;
        if (!start || !end) {
          return "-";
        }
        return Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
      },
    },
    {
      header: t("table.columns.price"),
      accessor: "price",
      render: (value) => value ?? "-",
    },
    {
      header: t("table.columns.status"),
      accessor: "isActive",
      render: (value) => {
        const config = value
          ? { text: t("table.status.active"), color: "text-green-700 border-green-300" }
          : { text: t("table.status.inactive"), color: "text-yellow-700 border-yellow-300" };
        return (
          <Badge variant="outline" className={`border ${config.color}`}>
            {config.text}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[250px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.placeholder")}
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

      </div>

      <DataTable<PackageListItem>
        key={`page-${page}-${data.length}`}
        columns={columns}
        data={data}
        onPageChange={onPageChange}
        totalPages={totalPages}
        rowIdKey="packageId"
        actions={(row) => (
          <div className="flex flex-col items-center justify-center w-full">
            <RowActions
              actions={[
                {
                  label: t("table.actions.view"),
                  icon: Eye,
                  onClick: () => handleView(row),
                },
                {
                  label: t("table.actions.edit"),
                  icon: Pencil,
                  onClick: () => handleEdit(row),
                },
                {
                  label: t("table.actions.delete"),
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.packageId),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />
            {deleteRowId === row.packageId && (
              <GeneralAlertDialog
                open={deleteRowId === row.packageId}
                onOpenChange={(open) => !open && setDeleteRowId(null)}
                trigger={null}
                title={t("table.delete_dialog.title")}
                description={t("table.delete_dialog.description", { name: row.name })}
                actionText={t("table.delete_dialog.confirm")}
                cancelText={t("table.delete_dialog.cancel")}
                onAction={() => handleDelete(row)}
                actionVariant="destructive"
              />
            )}
          </div>
        )}
      />


    </>
  );
}
