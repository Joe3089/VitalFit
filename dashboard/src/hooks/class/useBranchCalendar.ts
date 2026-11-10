"use client";

import { api } from "@/lib/sdk-config";
import { mapClassesToDateKey } from "@/utils/calendar-mappers";
import { useMemo } from "react";
import useSWR from "swr";

export function useBranchCalendar(
  branchID: string | null, 
  jwt: string,
  month?: number,
  year?: number
) {
  const swrKey = branchID && month && year 
    ? ["branches", branchID, "schedule", year, month] 
    : null;

  const fetcher = async () => {
    if (!branchID || !month || !year) {
       return null;
    }
    

    const response = await api.schedule.ListBranchesClass(
      branchID, 
      jwt, 
      month, 
      year
    );
    return response.data;
  };

  const { data, error, isValidating, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, 
    }
  );

  const scheduleMap = useMemo(() => {
    return data ? mapClassesToDateKey(data) : {};
  }, [data]);

  return {
    scheduleMap,
    isLoading: !data && isValidating,
    isSyncing: isValidating,
    isError: error,
    mutate,
  };
}