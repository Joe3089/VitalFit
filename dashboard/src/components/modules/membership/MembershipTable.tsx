"use client";
import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import ArrowDownTray from "@heroicons/react/24/outline/ArrowDownTrayIcon";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { useRouter } from "@/i18n/navigation"; 
import { MembershipType } from "@vitalfit/sdk";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface MembershipTableProps {
  data: MembershipType[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string };
  onFilterChange: (filters: { search?: string }) => void;
}

export default function MembershipTable({
  data,
  onReload,
  page,
  pageSize,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: MembershipTableProps) {
  const t = useTranslations("catalog.memberships");
  const [searchInput, setSearchInput] = useState(filters.search);

  // Estado para manejar qué fila se va a eliminar
  const [selectedMembership, setSelectedMembership] =
    useState<MembershipType | null>(null);

  const { token } = useAuth();
  const router = useRouter();

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

  const handleDelete = async () => {
    if (!selectedMembership || !token) {
      if (!token) {
        toast.error(t("notifications.delete_auth_error"));
      }
      return;
    }

    const toastId = toast.loading(t("loading"));
    try {
      await api.membership.deleteMembershipType(
        selectedMembership.membership_type_id,
        token
      );
      toast.success(t("notifications.delete_success"), { id: toastId });
      onReload();
    } catch (error) {
      console.error("Error al eliminar la membresía:", error);
      toast.error(t("notifications.delete_error"), { id: toastId });
    } finally {
      setSelectedMembership(null);
    }
  };

  const columns: Column<MembershipType>[] = [
    { header: t("table.columns.name"), accessor: "name" },
    { header: t("table.columns.description"), accessor: "description" },
    { header: t("table.columns.duration"), accessor: "duration_days" },
    { header: t("table.columns.price"), accessor: "price" },
    {
      header: t("table.columns.status"),
      accessor: "is_active",
      render: (value) => {
        const config = value
          ? {
              text: t("table.status.active"),
              color: "text-green-700 border-green-300",
            }
          : {
              text: t("table.status.inactive"),
              color: "text-yellow-700 border-yellow-300",
            };
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

      <DataTable<MembershipType>
        key={`page-${page}-${data.length}`}
        columns={columns}
        data={data}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        totalPages={totalPages}
        rowIdKey="membership_type_id"
        actions={(row) => (
          <RowActions
            actions={[
              {
                label: t("table.actions.view"),
                icon: Eye,
                onClick: () =>
                  router.push(`/catalog/memberships/${row.membership_type_id}`),
              },
              {
                label: t("table.actions.edit"),
                icon: Pencil,
                onClick: () =>
                  router.push(
                    `/catalog/memberships/${row.membership_type_id}/edit`
                  ),
              },
              {
                label: t("table.actions.delete"),
                icon: Trash2,
                onClick: () => setSelectedMembership(row),
                variant: "danger",
                separatorBefore: true,
              },
            ]}
          />
        )}
      />
      <GeneralAlertDialog
        open={!!selectedMembership}
        onOpenChange={(open) => !open && setSelectedMembership(null)}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description", {
          name: selectedMembership?.name ?? "",
        })}
        actionText={t("table.delete_dialog.confirm")}
        cancelText={t("table.delete_dialog.cancel")}
        onAction={handleDelete}
        actionVariant="destructive"
      />
    </>
  );
}
