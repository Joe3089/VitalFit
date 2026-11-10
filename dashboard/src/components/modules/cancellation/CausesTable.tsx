"use client";
import { useState, useEffect, useRef } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { Badge } from "@/components/ui/badge"; 
import { CancellationReason } from "@vitalfit/sdk";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface CausesTableProps {
  data: CancellationReason[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string }; 
  onFilterChange: (filters: { search: string }) => void; 
  onEdit: (row: CancellationReason) => void;
  onView: (row: CancellationReason) => void;
  isLoading?: boolean; 
}

export default function CausesTable({
  data,
  onReload,
  page,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
  onEdit,
  onView,
  isLoading, 
}: CausesTableProps) {
  const t = useTranslations("catalog.cancellationReason.CausesTable");
  const [searchInput, setSearchInput] = useState(filters.search);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const { token } = useAuth();
  
  const isInitialMount = useRef(true);


  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (searchInput === filters.search){
       return;
    }

    const timeout = setTimeout(() => {
      onFilterChange({ search: searchInput });
    }, 500); 

    return () => clearTimeout(timeout);
  }, [searchInput, onFilterChange, filters.search]);


  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleDeleteCause = async (row: CancellationReason) => {
    if (!token) {
      toast.error(t("deleteModal.error")); 
      return;
    }


    try {
      await api.membership.deleteCancelReason(row.reason_id, token);
      setDeleteRowId(null);
      toast.success(t("deleteModal.success"));
      onReload(); 
    } catch (error) {
      toast.error(t("deleteModal.error"));
    }
  };

  const StatusBadge = ({ status }: { status: "active" | "inactive" }) => {
    const config = {
      active: { variant: "success" as const, label: t("status.active") },
      inactive: { variant: "error" as const, label: t("status.inactive") }
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const columns: Column<CancellationReason>[] = [
    { 
      header: t("columns.description"), 
      accessor: "description", 
    },
    { 
      header: t("columns.status"), 
      accessor: "is_active",   
      render: (value) => {
        const statusString = value ? "active" : "inactive";
        return <StatusBadge status={statusString} />;
      }
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[250px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

      </div>

      <DataTable<CancellationReason>
        columns={columns}
        data={data}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isLoading={isLoading}
        rowIdKey="reason_id" 
        actions={(row) => (
          <div className="flex items-center justify-center w-full">
            <RowActions
              actions={[
                { label: t("actions.view"), icon: Eye, onClick: () => onView(row) },
                { label: t("actions.edit"), icon: Pencil, onClick: () => onEdit(row) },
                {
                  label: t("actions.delete"),
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.reason_id), 
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />

            <GeneralAlertDialog
              open={deleteRowId === row.reason_id}
              onOpenChange={(open) => !open && setDeleteRowId(null)}
              title={t("deleteModal.title")}
              description={t("deleteModal.description")}
              actionText={t("deleteModal.confirm")}
              cancelText={t("deleteModal.cancel")}
              onAction={() => handleDeleteCause(row)}
              actionVariant="destructive"
            />
          </div>
        )}
      />
    </>
  );
}