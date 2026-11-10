"use client";

import { api } from "@/lib/sdk-config";
import { ServicePublicItem } from "@vitalfit/sdk";
import { useState, useCallback, useRef } from "react";

export function useBranchServices() {
  const [services, setServices] = useState<ServicePublicItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);
  const LIMIT = 12;

  const fetchServices = useCallback(
    async (branchId: string, isNextPage = false, currency = "USD") => {
      if (!branchId || loadingRef.current || (isNextPage && !hasMore)) {
        return;
      }

      const pageToFetch = isNextPage ? page + 1 : 1;

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.public.getBranchServices(
          {
            limit: LIMIT,
            page: pageToFetch,
            currency: currency,
            sort: "desc",
            sortby: "price",
            category: "",
            price: 0,
            search: "",
          },
          branchId,
        );

        const newData = response.data || [];
        const totalItems = response.total || 0;

        setServices((prev) => {
          const updatedServices = isNextPage ? [...prev, ...newData] : newData;
          setHasMore(updatedServices.length < totalItems);
          return updatedServices;
        });

        setPage(pageToFetch);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("No se pudieron cargar los servicios.");
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [page, hasMore],
  );

  const resetServices = useCallback(() => {
    setServices([]);
    setPage(1);
    setHasMore(true);
    loadingRef.current = false;
  }, []);

  return {
    services,
    isLoading,
    error,
    hasMore,
    fetchServices,
    resetServices,
  };
}
