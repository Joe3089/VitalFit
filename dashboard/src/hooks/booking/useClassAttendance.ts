"use client";

import { useState } from "react";
import { usePaginatedSWR } from "@/hooks/usePaginatedSWR";
import { api } from "@/lib/sdk-config";
import { AttendanceHistory } from "@vitalfit/sdk";

interface AttendanceFilters {
  start?: string;
  end?: string;
  status?: "Attended" | "NoShow" | "Cancelled";
}

export function useClassAttendance(
  token: string | null,
  classId: string | null,
  filters: AttendanceFilters = {},
) {
  const [page, setPage] = useState(1);

  const key =
    token && classId
      ? [
          "attendance",
          "history",
          classId,
          page,
          filters.status,
          filters.start,
          filters.end,
        ]
      : null;

  const query = usePaginatedSWR<AttendanceHistory[]>(
    key,
    async () => {
      const response = await api.access.getClassAttendanceHistory(
        token!,
        classId!,
        filters.start,
        filters.end,
        filters.status,
      );
      return {
        data: response.data,
        total: response.data.length || 0,
        count: response.data.length,
        next: null,
        previous: null,
      };
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
    },
  );

  return {
    attendance: query.data?.data || [],
    total: query.data?.total || 0,
    count: query.data?.count || 0,
    currentPage: page,
    setPage,
    isLoading: query.isLoading,
    refresh: query.mutate,
    error: query.error,
  };
}
