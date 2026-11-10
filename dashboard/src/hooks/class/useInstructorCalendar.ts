"use client";

import { api } from "@/lib/sdk-config";
import { mapClassesToDateKey } from "@/utils/calendar-mappers";
import { useMemo } from "react";
import useSWR from "swr";

export function useInstructorCalendar(userId: string | null, token: string, month: number, year: number) {
  const swrKey = userId && token ? ["instructor-calendar", userId, year, month] : null;

  const fetcher = async () => {
    if (!userId || !token) {
        return null;
    }
    const response = await api.schedule.GetClassesByInstructor(token, userId, month, year);
    return response.data;
  };

  const { data, error, isValidating, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const scheduleMap = useMemo(() => (data ? mapClassesToDateKey(data) : {}), [data]);

  return { scheduleMap, isLoading: !data && !error, isSyncing: isValidating, mutate };
}