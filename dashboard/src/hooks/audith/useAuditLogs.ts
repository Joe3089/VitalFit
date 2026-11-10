import { AuditLog, PaginationRequest, PaginatedTotal } from "@vitalfit/sdk"; //
import { api } from "@/lib/sdk-config";
import { usePaginatedSWR } from "../usePaginatedSWR";

export function useAuditLogs(
  jwt: string,
  userId: string,
  filters: PaginationRequest,
  isAllLogs: boolean = true
) {
  const activeFilters = {
    ...filters,
    search: filters.search?.trim() ? filters.search : undefined,
  };

  const key = jwt ? ["audit-logs", userId, activeFilters, isAllLogs] : null;

  const { data, error, isLoading } = usePaginatedSWR<AuditLog[]>(
    key,
    () => isAllLogs 
      ? api.audit.getAllLogs(jwt, userId, activeFilters)
      : api.audit.getUserLogs(jwt, userId, activeFilters)
  );

  const logs = data?.data ?? []; 
  const totalItems = data?.total ?? 0;
  const limit = filters.limit ?? 10;

  return {
    logs, 
    totalPages: Math.ceil(totalItems / limit) || 1,
    totalItems, 
    isLoading,
    isError: error,
  };
}