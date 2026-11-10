"use client";

import { useState } from "react";
import { usePaginatedSWR } from "@/hooks/usePaginatedSWR"; 
import { api } from "@/lib/sdk-config";
import { BookingParticipant } from "@vitalfit/sdk";

export function useClassBookings(token: string | null, classId: string | null) {
  const [page, setPage] = useState(1);
  const key = token && classId ? ["bookings", "class", classId, page] : null;

  const query = usePaginatedSWR<BookingParticipant[]>(
    key,
    async () => {
      return await api.booking.getBookingClass(classId!, token!, { 
        limit: 10, 
        page: page, 
        sort: "desc" 
      });
    },
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      keepPreviousData: true 
    }
  );

  return {
    participants: query.data?.data || [], 
    total: query.data?.total || 0,
    count: query.data?.count || 0,
    currentPage: page,
    setPage, 
    isLoading: query.isLoading,
    refresh: query.mutate,
    error: query.error
  };
}