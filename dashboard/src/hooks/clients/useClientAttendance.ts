import { api } from "@/lib/sdk-config";
import useSWR from "swr";

export function useClientAttendance(
  userId: string | null,
  jwt: string | null,
  filters: { start?: string; end?: string; page?: number; limit?: number }
) {
  const { page = 1, limit = 10, start, end } = filters;

  const swrKey = userId && jwt 
    ? ["clients", userId, "attendance", { page, start, end }, jwt] 
    : null;

  const { data: response, error, isValidating, mutate } = useSWR(
    swrKey,
    async () => {
      const res = await api.access.getClientAttendanceHistory(
        jwt!, 
        userId!, 
        start, 
        end, 
        { page, limit }
      );
      return res; 
    },
    { 
      keepPreviousData: true,
      revalidateOnFocus: false 
    }
  );

  return {
    attendance: response?.data || [], 
    totalItems: response?.total || 0,
    totalPages: Math.ceil((response?.total || 0) / limit),
    isLoading: !response && !error,
    isSyncing: isValidating,
    isError: error,
    mutate,
  };
}