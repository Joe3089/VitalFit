
import { PaginatedTotal } from "@vitalfit/sdk";
import useSWR, { SWRConfiguration } from "swr";

/**
 * Hook genérico para consumir endpoints paginados del SDK
 * @template T - El tipo de dato del array (ej: AuditLog, UserSession, Client)
 */
export function usePaginatedSWR<T>(
  key: any[] | null, 
  fetcherFn: () => Promise<PaginatedTotal<T>>, 
  config?: SWRConfiguration
) {
  return useSWR<PaginatedTotal<T>>(
    key, 
    async () => {
      return await fetcherFn();
    }, 
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config 
    }
  );
}