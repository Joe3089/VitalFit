"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
import { useCancellation } from "@/hooks/cancellation-reason/useCancellation";
import { useAuth } from "@/context/AuthContext";
import { useState, useCallback, useMemo } from "react";
import CancellationTable from "@/components/modules/cancellation/CausesTable";
import { useTranslations } from "next-intl";
import { CancellationModal } from "@/components/modules/cancellation/CancellationModal";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";

export default function CancellationReasonPage() {
  const { token } = useAuth();
  const t = useTranslations("catalog.cancellationReason");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedCancellation, setSelectedCancellation] = useState<any>({ description: "", is_active: true });
  const [isSaving, setIsSaving] = useState(false);
  const memoizedFilters = useMemo(() => ({ search }), [search]);

  const {
    cancellationData,
    isLoading,
    totalPages,
    totalItems,
    refresh
  } = useCancellation(token, memoizedFilters, page);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedCancellation({ description: "", is_active: true });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEdit = useCallback((row: any) => {
    setSelectedCancellation(row);
    setModalMode("edit");
    setIsModalOpen(true);
  }, []);

  const handleOpenView = useCallback((row: any) => {
    setSelectedCancellation(row);
    setModalMode("view");
    setIsModalOpen(true);
  }, []);

  const handleSave = async (dataFromModal: any) => {
    if (!token) {
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === "create") {
        await api.membership.createCancelReason(dataFromModal, token);
      } else {

        await api.membership.updateCancelReason(dataFromModal.reason_id, dataFromModal, token);
      }
      setIsModalOpen(false);
      refresh();
      toast.success("Operación exitosa");
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title={t("title")}>
        <Button onClick={handleOpenCreate} className="bg-[#FF6600] text-white">
          <PlusIcon className="h-5 w-5 mr-2" />
          {t("addButton")}
        </Button>
      </PageHeader>

      <div className="bg-white rounded-lg shadow-sm p-4 relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
          </div>
        )}

        <CancellationTable
          data={cancellationData}
          onReload={refresh}
          page={page}
          pageSize={10}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          filters={memoizedFilters}
          onFilterChange={(f) => handleFilterChange(f.search || "")}
          onEdit={handleOpenEdit}
          onView={handleOpenView}
        />
      </div>

      <CancellationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        cancellation={selectedCancellation}
        onSave={handleSave} 
        isLoading={isSaving}
      />
    </div>
  );
}