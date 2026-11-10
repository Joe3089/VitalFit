"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FiscalForm from "./FiscalForm";
import { FiscalDocument } from "@vitalfit/sdk";

interface FiscalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: FiscalDocument | null;
  mode: "create" | "edit" | "view";
  onSave: (data: Partial<FiscalDocument>) => Promise<void>;
  isSubmitting?: boolean;
  errors?: Record<string, string>; 
}

export default function FiscalDocumentModal({
  open,
  onOpenChange,
  document,
  mode,
  onSave,
  isSubmitting = false,
  errors = {},
}: FiscalModalProps) {
  const t = useTranslations("catalog.fiscal_documents");

  const [formData, setFormData] = useState<FiscalDocument>({
    name: "",
    prefix: "",
  } as FiscalDocument);

  useEffect(() => {
    if (open) {
      setFormData(document || ({ name: "", prefix: "" } as FiscalDocument));
    }
  }, [document, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      return;
    }
    
    await onSave({
      name: formData.name,
      prefix: formData.prefix,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="hidden">
          <DialogTitle>Fiscal Document Modal</DialogTitle>
        </DialogHeader>

        <div className="pt-8 px-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-[#ff6b00] rounded-full" />
            <h2 className="text-2xl font-bold text-[#1e293b] tracking-tight uppercase">
              {mode === "create" ? t("create.title") : mode === "edit" ? t("edit.title") : t("view.title")}
            </h2>
          </div>
          <div className="h-[1px] bg-slate-100 w-full mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="py-4">
            <FiscalForm
              document={formData}
              mode={mode}
              errors={errors} 
              onChange={(field, value) =>
                setFormData((prev) => ({ ...prev, [field]: value }))
              }
            />
          </div>

          <DialogFooter className="mt-8 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
            >
              {t("form.buttons.cancel")}
            </Button>
            
            {mode !== "view" && (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-12 px-10 rounded-xl bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? t("form.buttons.saving") : t("form.buttons.save")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}