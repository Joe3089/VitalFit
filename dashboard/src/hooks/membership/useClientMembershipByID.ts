"use client";

import { api } from "@/lib/sdk-config";
import { ClientMembershipDetail } from "@vitalfit/sdk";
import { useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";

export function useClientMembershipByID(token: string | null) {

  const t = useTranslations("finance.MembershipManagement.messages");
  
  const [membership, setMembership] = useState<ClientMembershipDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isFetching = useRef(false);

  const fetchMembershipById = useCallback(async (id: string) => {
    if (!token || !id) {
      return;
    }
    if (isFetching.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    isFetching.current = true;

    try {
      const response = await api.membership.getClientMembershipByID(id, token);
      
      if (response && response.data) {
        setMembership(response.data);
      } else {

        throw new Error(t("notFound"));
      }
    } catch (err: any) {

      const errorMessage = err?.response?.data?.message || t("errorDetail");
      setError(new Error(errorMessage));
      setMembership(null);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }

  }, [token, t]); 

  return {
    membership,
    isLoading,
    error,
    fetchMembershipById
  };
}