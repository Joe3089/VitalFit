"use client";

import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { InstructorDataList } from "@vitalfit/sdk";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { toast } from "sonner"; 
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface InstructorsTableProps {
  data: InstructorDataList[];
  isLoading: boolean; 
  onReload: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string; sort: string };
  onFilterChange: (filters: { search?: string; sort?: string }) => void;
}

export default function InstructorsTable({
  data,
  isLoading,
  onReload,
  page,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: InstructorsTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  
  const t = useTranslations("catalog.instructor.table");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleDeleteInstructor = async (instructor: InstructorDataList) => {
    if (!token) {
      return;

    }
    const toastId = toast.loading(t("messages.deleting"));
    try {
      await api.instructor.deleteInstructor(instructor.instructor_id, token);
      toast.success(t("messages.deleted_success"), { id: toastId });
      onReload();
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error(t("messages.delete_error"), { id: toastId });
    } finally {
      setDeleteRowId(null);
    }
  };

  const columns: Column<InstructorDataList>[] = [
    {
      header: t("columns.name"),
      accessor: "first_name",
      render: (value, row) => (
        <div className="font-medium text-slate-900">
          {value} {row.last_name}
        </div>
      ),
    },
    {
      header: t("columns.email"),
      accessor: "email",
      render: (email) => (
        <div className="text-slate-500 hover:text-orange-400 transition-colors cursor-default">
          {email}
        </div>
      ),
    },
    {
      header: t("columns.document"),
      accessor: "identity_document",
    },
    {
      header: t("columns.phone"),
      accessor: "phone",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[350px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <DataTable<InstructorDataList>
        key={`instructor-page-${page}`} 
        columns={columns}
        data={data}
        isLoading={isLoading}
        onPageChange={onPageChange}
        page={page}
        totalPages={totalPages}
        rowIdKey="instructor_id"
        actions={(row) => (
          <div className="flex flex-col items-center justify-center w-full">
            <RowActions
              actions={[
                { 
                  label: t("actions.view"), 
                  icon: Eye, 
                  onClick: () => router.push(`/catalog/instructors/${row.instructor_id}`) 
                },
                {
                  label: t("actions.edit"),
                  icon: Pencil,
                  onClick: () => router.push(`/catalog/instructors/${row.instructor_id}/edit`),
                },
                {
                  label: t("actions.delete"),
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.instructor_id),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />
            <GeneralAlertDialog
              open={deleteRowId === row.instructor_id}
              onOpenChange={(open) => !open && setDeleteRowId(null)}
              title={t("delete_dialog.title")}
              description={t("delete_dialog.description", { name: `${row.first_name} ${row.last_name}` })}
              actionText={t("delete_dialog.action")}
              onAction={() => handleDeleteInstructor(row)}
              actionVariant="destructive"
            />
          </div>
        )}
      />
    </>
  );
}