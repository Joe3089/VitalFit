"use client";

import { useState } from "react";
import { api } from "@/lib/sdk-config";
import { MedicalProfile } from "@vitalfit/sdk";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const useMedicalActions = (userId: string, token: string | null) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("clients.medical.notifications"); 

  const saveMedicalProfile = async (formData: MedicalProfile, exists: boolean) => {
    if (!userId || !token) {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      if (!exists) {
        await api.user.createMedicalProfile(userId, formData, token);
        toast.success(t("create_success"));
      } else {
        await api.user.updateMedicalProfile(userId, formData, token);
        toast.success(t("update_success"));
      }
      return true;
    } catch (error) {
      toast.error(t("save_error"));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { saveMedicalProfile, isSubmitting };
};