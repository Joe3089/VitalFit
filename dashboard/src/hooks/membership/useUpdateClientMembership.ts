"use client";

import { api } from "@/lib/sdk-config";
import { UpdateClientMembershipRequest } from "@vitalfit/sdk";
import { useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";

export function useUpdateClientMembership(token: string | null) {
  const t = useTranslations("finance.MembershipManagement.messages");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const isRequestInProgress = useRef(false);

  const update = useCallback(
    async (membershipId: string, data: UpdateClientMembershipRequest) => {
      if (!token || !membershipId) {
        return { success: false, error: t("missingParams") };
      }
      if (isRequestInProgress.current) {
        return { success: false, error: t("requestInProgress") };
      }

      setIsUpdating(true);
      setError(null);
      isRequestInProgress.current = true;

      try {
        const response = await api.membership.updateClientMembership(membershipId, data, token);
        
        return { success: true, data: response };
      } catch (err: any) {

        const errorMessage = err?.response?.data?.message || t("errorUpdate");
        const customError = new Error(errorMessage);
        
        setError(customError);
        return { success: false, error: errorMessage };
      } finally {
        setIsUpdating(false);
        isRequestInProgress.current = false;
      }
    },
    [token, t]
  );

  return { update, isUpdating, error };
}