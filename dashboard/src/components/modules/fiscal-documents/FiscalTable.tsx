"use client";
import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Input } from "@/components/ui/Input";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { toast } from "sonner"; 
import { useTranslations } from "next-intl";
import { FiscalDocument } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import { useFiscalDocumentActions } from "@/hooks/fiscal-documents/useFiscalDocumentActions";

interface FiscalTableProps {
  data: FiscalDocument[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string };
  onFilterChange: (filters: { search?: string }) => void;
  // Nuevas props para delegar la apertura del modal al padre
  onView: (doc: FiscalDocument) => void;
  onEdit: (doc: FiscalDocument) => void;
  isLoading?: boolean;
}

export default function FiscalTable({
  data,
  onReload,
  page,
  pageSize,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
  onView,
  onEdit,
  isLoading = false,
}: FiscalTableProps) {
  const t = useTranslations("catalog.fiscal_documents.table");
  const { token } = useAuth();
  const { deleteDocument } = useFiscalDocumentActions(token);
  
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedDoc, setSelectedDoc] = useState<FiscalDocument | null>(null);


  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, onFilterChange]);

  const handleDeleteDocument = async () => {
    if (!selectedDoc?.document_type_id) {
      return;
    }

    const toastId = toast.loading(t("notifications.deleting") || "Eliminando...");
    try {
      await deleteDocument(selectedDoc.document_type_id);
      toast.success(t("notifications.delete_success"), { id: toastId });
      onReload();
    } catch (error) {
      console.error(error);
      toast.error(t("notifications.delete_error"), { id: toastId });
    } finally {
      setSelectedDoc(null);
    }
  };

  const columns: Column<FiscalDocument>[] = [
    { header: t("columns.name"), accessor: "name" },
    { header: t("columns.prefix"), accessor: "prefix" },
    { 
      header: t("columns.created_at"), 
      accessor: "created_at",
      render: (value) => value ? new Date(value as string).toLocaleDateString() : "-"
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[250px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

      </div>

      <DataTable<FiscalDocument>
        key={`page-${page}-${data.length}`}
        columns={columns}
        data={data}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        totalPages={totalPages}
        rowIdKey="document_type_id"
        isLoading={isLoading}
        actions={(row) => (
          <RowActions
            actions={[
              { 
                label: t("actions.view"), 
                icon: Eye, 
                onClick: () => onView(row) 
              },
              {
                label: t("actions.edit"),
                icon: Pencil,
                onClick: () => onEdit(row), 
              },
              {
                label: t("actions.delete"),
                icon: Trash2,
                onClick: () => setSelectedDoc(row),
                variant: "danger",
                separatorBefore: true,
              },
            ]}
          />
        )}
      />

      <GeneralAlertDialog
        open={!!selectedDoc}
        onOpenChange={(open) => !open && setSelectedDoc(null)}
        title={t("delete_dialog.title")}
        description={t("delete_dialog.description", { name: selectedDoc?.name ?? "" })}
        actionText={t("delete_dialog.confirm")}
        cancelText={t("delete_dialog.cancel")}
        onAction={handleDeleteDocument}
        actionVariant="destructive"
      />
    </>
  );
}