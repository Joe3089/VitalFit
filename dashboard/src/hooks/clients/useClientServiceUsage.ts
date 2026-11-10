"use client";

import { api } from "@/lib/sdk-config";
import useSWR from "swr";

export function useClientServiceUsage(
  userId: string | null,
  jwt: string | null,
  filters: { start?: string; end?: string; page?: number; limit?: number }
) {
  const { page = 1, limit = 10, start, end } = filters;

  const swrKey = userId && jwt 
    ? ["clients", userId, "service-usage", { page, start, end }, jwt] 
    : null;

  const { data: response, error, isValidating, mutate } = useSWR(
    swrKey,
    () => api.access.getClientServiceUsage(jwt!, userId!, start, end, { page, limit }),
    { 
      keepPreviousData: true,
      revalidateOnFocus: false 
    }
  );

  return {
    usage: response?.data || [],
    totalItems: response?.total || 0,
    totalPages: Math.ceil((response?.total || 0) / limit),
    isLoading: !response && !error,
    isSyncing: isValidating,
    isError: error,
    mutate,
  };
}