"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { apiErrorMessage } from "@/hooks/advanced/useTokenSWR";

interface CancelClassDialogProps {
  classId: string;
  onCancelled: () => void;
}

/** HU-CLA-03: cancels a class keeping the reason for traceability. */
export function CancelClassDialog({ classId, onCancelled }: CancelClassDialogProps) {
  const t = useTranslations("advanced.cancelClass");
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!token || reason.trim().length < 3) {
      return;
    }
    setSaving(true);
    try {
      const res = await api.schedule.CancelClass(classId, reason.trim(), token);
      toast.success(t("success", { count: res.affected_bookings }));
      setOpen(false);
      setReason("");
      onCancelled();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-amber-600 hover:bg-amber-50 text-xs font-bold px-2">
          <Ban className="w-4 h-4 mr-2" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="z-[60]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("placeholder")}
          maxLength={1000}
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {t("close")}
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={saving || reason.trim().length < 3}
          >
            {saving ? t("saving") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
