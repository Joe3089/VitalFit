"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { CancellationReason, CreateCancellationReason } from "@vitalfit/sdk";
import { Loader2 } from "lucide-react";
import CancellationForm from "./cancellationForm";
import { useState, useEffect } from "react";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Cambiamos onSave para que reciba los datos finales
  onSave: (data: any) => void; 
  cancellation: CancellationReason | CreateCancellationReason;
  mode: "create" | "edit" | "view";
  isLoading?: boolean;
  errors?: any;
}

export function CancellationModal({
  isOpen,
  onClose,
  onSave,
  cancellation,
  mode,
  isLoading,
  errors,
}: CancellationModalProps) {
  const t = useTranslations("catalog.cancellationReason");

  // --- ESTADO LOCAL ---
  // Este estado mantiene los cambios mientras el usuario escribe
  const [localCancellation, setLocalCancellation] = useState(cancellation);

  // Sincronizar el estado local cuando el modal se abre o cambia la prop 'cancellation'
  useEffect(() => {
    if (isOpen) {
      setLocalCancellation(cancellation);
    }
  }, [isOpen, cancellation]);

  const handleLocalChange = (field: any, value: any) => {
    setLocalCancellation((prev) => ({ ...prev, [field]: value }));
  };

  const getTitle = () => {
    if (mode === "create"){
       return t("addButton");
    }
    if (mode === "edit") {
      return t("CausesTable.actions.edit");
    }
    return t("CausesTable.actions.view");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold border-b pb-4 uppercase">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <CancellationForm
            cancellation={localCancellation}
            onChange={handleLocalChange}
            mode={mode}
            errors={errors}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
          >
            {t("CausesTable.deleteModal.cancel")}
          </Button>

          {mode !== "view" && (
            <Button 
              onClick={() => onSave(localCancellation)} 
              disabled={isLoading}
              className="min-w-[120px] bg-[#FF6600] hover:bg-[#E65C00] text-white" 
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              
              {mode === "create" 
                ? t("CausesTable.actions.save") 
                : t("CausesTable.actions.edit")       
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}