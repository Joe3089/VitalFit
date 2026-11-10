"use client";

import useSWR from "swr";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useMemo } from "react";
import { BranchServicePrice } from "@vitalfit/sdk";


export function useBranchServices(
  branchId: string | undefined,
  token: string | null,
) {

  const key =
    branchId && token
      ? [`/branches/${branchId}/services`, branchId, token]
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {

      const response = await api.products.getBranchServices(
        branchId!,
        token!,
      );
      return response.data;
    },
    {
      revalidateOnFocus: false, 
      shouldRetryOnError: false,
      onError: (err) => {
        console.error("Error al cargar servicios de la sede:", err);
        toast.error("No se pudieron cargar los servicios.");
      },
    },
  );

  const services = useMemo(() => {
    if (!data) {
         return [];
    }

    return data.filter((s: BranchServicePrice) => s.is_visible);
  }, [data]);

  const statusError = useMemo(() => {
    if (!error) {
        return null;
    }
    const status = error?.status || error?.response?.status;
    if (status === 403 || status === 401) {
        return "forbidden";
    }
    if (status === 404) {
        return "not_found";
    }
    return "error";
  }, [error]);

  return {
    services,
    loading: isLoading,
    error: statusError,
    isEmpty: !isLoading && services.length === 0,
    refresh: mutate,
  };
}
