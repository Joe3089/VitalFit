"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { api } from "@/lib/sdk-config";

export function useInstructorClients({
  token,
  instructorId,
  initialLimit = 10,
}: {
  token: string | null;
  instructorId: string | null;
  initialLimit?: number;
}) {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [filters, setFilters] = useState({ search: "", sort: "desc" });

  const { data, error, isLoading, mutate } = useSWR(
    token && instructorId
      ? ["instructor-clients", instructorId, page, limit, filters.search, filters.sort]
      : null,
    async () => {
      return await api.instructor.getAssignedClients(token!, instructorId!, {
        page,
        limit,
        search: filters.search,
        sort: filters.sort as "asc" | "desc",
      });
    },
    { keepPreviousData: true }
  );

  const onFilterChange = useCallback((newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    data: data?.data || [],
    isLoading,
    reload: mutate,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
      onPageChange,
    },
    filters,
    onFilterChange,
  };
}