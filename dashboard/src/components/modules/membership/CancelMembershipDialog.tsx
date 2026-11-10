"use client";

import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";

import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CancellationReason } from "@vitalfit/sdk";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useTranslations } from "next-intl";

interface CancelMembershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason_id: string; notes: string }) => void;
  isLoading: boolean;
  cancellationReasons: CancellationReason[];
}

export function CancelMembershipDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  cancellationReasons 
}: CancelMembershipDialogProps) {
  const t = useTranslations("finance.MembershipManagement.cancelDialog");
  const [reasonId, setReasonId] = useState("");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!reasonId) {
      return;
    }
    onConfirm({ reason_id: reasonId, notes });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReasonId("");
      setNotes("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight font-bold text-red-600">
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label className="font-bold">{t("reasonLabel")}</Label>
            <Select onValueChange={setReasonId} value={reasonId}>
              <SelectTrigger className="bg-slate-50 border-none h-11">
                <SelectValue placeholder={t("reasonPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {cancellationReasons.length > 0 ? (
                  cancellationReasons.map((reason) => (
                    <SelectItem key={reason.reason_id} value={reason.reason_id}>
                      {reason.description}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {t("noReasons")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">{t("notesLabel")}</Label>
            <Textarea 
              placeholder={t("notesPlaceholder")} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50 border-none min-h-[100px]"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
          >
            {t("cancelButton")}
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs px-6"
            onClick={handleConfirm}
            disabled={isLoading || !reasonId}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                {t("processing")}
              </span>
            ) : (
              t("confirmButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}