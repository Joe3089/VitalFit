"use client";

import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { ServiceFullDetail, ServiceCategoryInfo } from "@vitalfit/sdk";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RowActions } from "@/components/ui/table/RowActions";
import { useRouter } from "@/i18n/navigation";

interface ServicesTableProps {
  data: ServiceFullDetail[];
  categories: ServiceCategoryInfo[];
  isLoading: boolean;
  onReload: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string; category: string };
  onFilterChange: (newFilters: { search?: string; category?: string }) => void;
}

export default function ServicesTable({
  data,
  categories,
  isLoading,
  onReload,
  page,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: ServicesTableProps) {
  const t = useTranslations("catalog.services.table");
  const router = useRouter();
  const { token } = useAuth();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, onFilterChange]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleDeleteService = async (serviceId: string) => {
    if (!token) {
      return;
    }

    const toastId = toast.loading(t("actions.delete") + "...");
    try {
      await api.products.deleteService(serviceId, token);
      toast.success(t("actions.delete") + " OK", { id: toastId });
      onReload();
    } catch (error) {
      console.error(error);
      toast.error(t("actions.delete") + " Error", { id: toastId });
    } finally {
      setDeleteRowId(null);
    }
  };

  const columns: Column<ServiceFullDetail>[] = [
    {
      header: t("columns.name"),
      accessor: "name",
      render: (value) => (
        <span className="font-medium text-slate-900">
          {String(value)}
        </span>
      ),
    },
    {
      header: t("columns.category"),
      accessor: "service_category",
      render: (category) => {
        const cat = category as ServiceCategoryInfo;
        return (
          <span className="text-slate-500">
            {cat?.name || t("noCategory")}
          </span>
        );
      },
    },
    {
      header: t("columns.duration"),
      accessor: "duration_minutes",
      render: (duration) => (
        <span className="text-sm">
          {Number(duration)} min
        </span>
      ),
    },
    {
      header: t("columns.featured"),
      accessor: "is_featured",
      render: (isFeatured) => (
        <div className="flex justify-center">
          <StarIcon
            className={`h-5 w-5 ${
              Boolean(isFeatured) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-slate-300"
            }`}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative w-full sm:w-[300px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("placeholder")}
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <Select
            value={filters.category || "all"}
            onValueChange={(val) => onFilterChange({ category: val })}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("columns.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.category_id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <DataTable<ServiceFullDetail>
        columns={columns}
        data={data}
        isLoading={isLoading}
        onPageChange={onPageChange}
        page={page}
        totalPages={totalPages}
        rowIdKey="service_id"
        actions={(row) => (
          <div className="flex items-center justify-center">
            <RowActions
              actions={[
                {
                  label: t("actions.view"),
                  icon: Eye,
                  onClick: () => router.push(`/catalog/services/${row.service_id}`)
                },
                {
                  label: t("actions.edit"),
                  icon: Pencil,
                  onClick: () => router.push(`/catalog/services/${row.service_id}/edit`)
                },
                {
                  label: t("actions.delete"),
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.service_id),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />

            <GeneralAlertDialog
              open={deleteRowId === row.service_id}
              onOpenChange={(open) => !open && setDeleteRowId(null)}
              title={t("deleteDialog.title")}
              description={t("deleteDialog.description").replace("{name}", row.name)}
              actionText={t("deleteDialog.confirm")}
              cancelText={t("deleteDialog.cancel")}
              onAction={() => handleDeleteService(row.service_id)}
              actionVariant="destructive"
            />
          </div>
        )}
      />
    </>
  );
}