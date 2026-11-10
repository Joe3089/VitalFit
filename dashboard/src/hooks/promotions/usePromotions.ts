import { api } from "@/lib/sdk-config";
import { Promotion } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

interface Filters {
  search?: string;
}

export function usePromotions(token: string | null, filters: Filters, page: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [promotionData, setPromotionData] = useState<Promotion[]>([]);
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
      const response = await api.marketing.getPromotion(token, {
        limit: pageSize,
        page: page,
        sort: "desc",
        search: debouncedSearch?.trim() || undefined,
      });

      setPromotionData(response.data || []);
      setTotalItems(response.total || 0); 
      setError(null);
    } catch (err: any) {
      console.error("Error al cargar promociones:", err);
      setError(err as Error);
      setPromotionData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, debouncedSearch, page]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isLoading,
    promotionData,
    error,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    mutate: loadData 
  };
}