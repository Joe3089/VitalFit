"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SessionsList } from "./SessionsList"; 
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SecuritySessionsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecuritySessionsDialog({
  userId,
  open,
  onOpenChange,
}: SecuritySessionsDialogProps) {
  const t = useTranslations("user.audit.sessions");
  const { token } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden outline-none">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              {t("title")}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {userId && token && (
            <SessionsList userId={userId} token={token} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}