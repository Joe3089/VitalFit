"use client";

import useSWR from "swr";
import { api } from "@/lib/sdk-config";

export function useBookingCount(token: string | null, classId: string | null) {

  const key = token && classId ? ["schedule", classId, "bookings-count"] : null;

  const { data, error, mutate, isLoading } = useSWR(
    key, 
    async () => {

      if (!classId || !token){
         return 0;
      }
      
      const res = await api.booking.getClassBookingCount(classId, token);

      const countData = res as { count: number };
      return typeof countData.count === "number" ? countData.count : 0;
    }, 
    {
      revalidateOnFocus: true, 
      dedupingInterval: 5000,  
      fallbackData: 0          
    }
  );

  return {
    count: data ?? 0,
    isLoading,
    mutate,
    error
  };
}