"use client";

import { api } from "@/lib/sdk-config";
import { ClientMembershipItem } from "@vitalfit/sdk";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

export function useClientMembership(token: string) {
  const t = useTranslations("finance.MembershipManagement.messages");
  
  const [memberships, setMemberships] = useState<ClientMembershipItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMembership = useCallback(
    async (params: { page?: number; search?: string }) => {
      if (!token) {
        return;
      }

      setLoading(true);
      try {
        const response = await api.membership.getClientMemberships(token, {
          page: params.page || 1,
          limit: 10,
          sort: "desc",
          search: params.search || "", 
        });
        
        setMemberships(response.data);
        setTotal(response.total);
      } catch (error) {
        console.error(t("errorFetching"), error);
      } finally {
        setLoading(false);
      }
    },
    [token, t]
  );

  return { memberships, total, loading, fetchMembership };
}