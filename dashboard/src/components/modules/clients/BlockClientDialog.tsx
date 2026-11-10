"use client";

import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ban, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/Textarea";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justification: string) => Promise<void>;
  isLoading: boolean;
  clientName: string;
}

export const BlockClientDialog = ({ isOpen, onOpenChange, onConfirm, isLoading, clientName }: Props) => {
  const t = useTranslations("clients.view.block_dialog");
  const [justification, setJustification] = useState("");

  const handleConfirm = async () => {
    if (!justification.trim()) {
      toast.error(t("error_required"));
      return;
    }
    await onConfirm(justification);
    setJustification("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-red-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
            <Ban className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl italic font-black uppercase tracking-tighter text-center">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("description")} <span className="font-bold text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
            {t("label")}
          </label>
          <Textarea
            placeholder={t("placeholder")}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="mt-1 resize-none border-slate-200 focus:ring-red-500/20"
            rows={4}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isLoading || !justification.trim()}
            className="font-bold italic uppercase tracking-tighter"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};