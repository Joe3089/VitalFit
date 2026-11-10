"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFiscalDocuments } from "@/hooks/fiscal-documents/useFiscalDocuments";
import { useFiscalDocumentActions } from "@/hooks/fiscal-documents/useFiscalDocumentActions";
import { FiscalDocument as FiscalDocumentType } from "@vitalfit/sdk";
import FiscalTable from "@/components/modules/fiscal-documents/FiscalTable";
import FiscalDocumentModal from "@/components/modules/fiscal-documents/FiscalDocumentModal";
import { fiscalDocumentSchema } from "@/lib/validation/fiscal-document.schema";

export default function FiscalDocumentPage() {
  const t = useTranslations("catalog.fiscal_documents");
  const { token } = useAuth();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<FiscalDocumentType | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data, isLoading, totalPages, refresh } = useFiscalDocuments({
    token,
    page,
    filters,
  });

  const { createDocument, updateDocument, isSubmitting } = useFiscalDocumentActions(token);

  const handleOpenCreateModal = () => {
    setActiveDoc(null);
    setModalMode("create");
    setFormErrors({}); 
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: FiscalDocumentType) => {
    setActiveDoc(doc);
    setModalMode("edit");
    setFormErrors({}); 
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (doc: FiscalDocumentType) => {
    setActiveDoc(doc);
    setModalMode("view");
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (formData: Partial<FiscalDocumentType>) => {

    setFormErrors({});
   
    const result = fiscalDocumentSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = t(issue.message); 
      });
      
      setFormErrors(errors);

      const firstErrorKey = result.error.issues[0].message;
      toast.error(t(firstErrorKey));
      return;
    }

    const toastId = toast.loading(t("form.buttons.saving"));
    
    try {
      if (modalMode === "create") {
        await createDocument({
          name: result.data.name,
          prefix: result.data.prefix,
        });
        toast.success(t("form.notifications.create_success"), { id: toastId });
      } else if (modalMode === "edit" && activeDoc?.document_type_id) {
        await updateDocument(activeDoc.document_type_id, {
          name: result.data.name,
          prefix: result.data.prefix,
        });
        toast.success(t("form.notifications.update_success"), { id: toastId });
      }
      
      refresh(); 
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("form.notifications.error"), { id: toastId });
    }
  };

  const handleFilterChange = (newFilters: { search?: string }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader 
        title={t("title") || "DOCUMENTOS FISCALES"} 
        subtitle={t("subtitle") || "Listado del catálogo de documentos Fiscales"}
      >
        <Button
          className="bg-primary text-white"
          onClick={handleOpenCreateModal}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t("add_button") || "Agregar Documento"}
        </Button>
      </PageHeader>

      <FiscalTable
        data={data}
        isLoading={isLoading}
        onReload={refresh}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        totalPages={totalPages}
        filters={filters}
        onFilterChange={handleFilterChange}
        onEdit={handleOpenEditModal}
        onView={handleOpenViewModal}
      />

      <FiscalDocumentModal
        open={isModalOpen}
        onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setFormErrors({});
            }
        }}
        document={activeDoc}
        mode={modalMode}
        onSave={handleSave} 
        isSubmitting={isSubmitting}
        errors={formErrors}
      />
    </div>
  );
}