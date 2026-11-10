"use client";

import { api } from "@/lib/sdk-config";
import { InvoiceList, PaginationWithStatus } from "@vitalfit/sdk";
import { useState, useEffect, useCallback, useRef } from "react";

export function useInvoices(token: string, branchID?: string) {
  const [data, setData] = useState<InvoiceList[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [filters, setFilters] = useState<PaginationWithStatus>({
    page: 1,
    limit: 10,
    sort: "desc",
    search: "",
    status: undefined,
  });

  const loadInvoices = useCallback(async () => {
    if (!token) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const response = await api.billing.getInvoices(token, filters, branchID);

      setData(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error cargando facturas:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [token, filters, branchID]);

  useEffect(() => {
    loadInvoices();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadInvoices]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, [branchID]);

  const updateFilters = (newFilters: Partial<PaginationWithStatus>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
  };

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return {
    data,
    loading,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / (filters.limit || 10))),
    filters,
    updateFilters,
    changePage,
    refresh: loadInvoices,
  };
}
