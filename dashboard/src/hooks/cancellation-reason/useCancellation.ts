import { api } from "@/lib/sdk-config";
import { CancellationReason } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

interface Filters {
  search?: string;
}

export function useCancellation(token: string | null, filters: Filters, page: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [cancellationData, setCancellationData] = useState<CancellationReason[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500); 

    return () => clearTimeout(handler);
  }, [filters.search]);

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.membership.getCancelReasons(token, {
        limit: pageSize,
        page: page,
        sort: "desc",
        search: debouncedSearch?.trim() || undefined,
      });

      setCancellationData(response.data || []);
      setTotalItems(response.total || 0); 
      setError(null);
    } catch (err) {
      console.error("Error al cargar razones:", err);
      setError(err as Error);
      setCancellationData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, debouncedSearch, page]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isLoading,
    cancellationData,
    error,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    refresh: loadData
  };
}