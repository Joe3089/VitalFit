"use client";
import { useState, useEffect } from "react";
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
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { Equipment, EquipmentCategory } from "@vitalfit/sdk";
import { useRouter } from "next/navigation";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface EquipmentTableProps {
  data: Equipment[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search?: string; category?: EquipmentCategory };
  onFilterChange: (filters: { search?: string; category?: EquipmentCategory }) => void;
}

export default function EquipmentTable({
  data,
  onReload,
  page,
  pageSize,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: EquipmentTableProps) {
  const t = useTranslations("catalog.equipment.table");
  const tCategories = useTranslations("catalog.equipment.categories");
  const tNotifications = useTranslations("catalog.equipment.notifications");
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleDeleteEquipment = async (equipment: Equipment) => {
    if (!token) {
      return;
    }
    try {
      await api.equipment.deleteEquipment(equipment.equipment_id, token);
      toast.success(tNotifications("delete_success"));
      onReload();
    } catch (error) {
      toast.error(tNotifications("delete_error"));
    } finally {
      setDeleteRowId(null);
    }
  };

  const columns: Column<Equipment>[] = [
    { header: t("columns.name"), accessor: "name" },
    {
      header: t("columns.category"),
      accessor: "category",
      render: (value) => tCategories(value as any)
    },
    { header: t("columns.model"), accessor: "model" },
    { header: t("columns.brand"), accessor: "brand" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[250px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("filter_placeholder")}
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              category: value === "all" ? undefined : (value as EquipmentCategory),
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("category_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_categories")}</SelectItem>
            <SelectItem value="Cardio">{tCategories("Cardio")}</SelectItem>
            <SelectItem value="Strength">{tCategories("Strength")}</SelectItem>
            <SelectItem value="FreeWeight">{tCategories("FreeWeight")}</SelectItem>
            <SelectItem value="Functional">{tCategories("Functional")}</SelectItem>
            <SelectItem value="Accessory">{tCategories("Accessory")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable<Equipment>
        key={`table-page-${page}`}
        columns={columns}
        data={data}
        page={page}
        onPageChange={onPageChange}
        totalPages={totalPages}
        rowIdKey="equipment_id"
        actions={(row) => (
          <div className="flex flex-col items-center justify-center w-full">
            <RowActions
              actions={[
                {
                  label: t("actions.view"),
                  icon: Eye,
                  onClick: () => router.replace(`/catalog/equipment/${row.equipment_id}`),
                },
                {
                  label: t("actions.edit"),
                  icon: Pencil,
                  onClick: () => router.replace(`/catalog/equipment/${row.equipment_id}/edit`),
                },
                {
                  label: t("actions.delete"),
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.equipment_id),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />

            {deleteRowId === row.equipment_id && (
              <GeneralAlertDialog
                open={true}
                onOpenChange={(open) => !open && setDeleteRowId(null)}
                title={t("delete_dialog.title")}
                description={t("delete_dialog.description", { name: row.name })}
                actionText={t("delete_dialog.confirm")}
                onAction={() => handleDeleteEquipment(row)}
                actionVariant="destructive"
              />
            )}
          </div>
        )}
      />
    </>
  );
}