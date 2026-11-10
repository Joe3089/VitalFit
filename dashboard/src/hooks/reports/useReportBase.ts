import useSWR from "swr";

export function useReportBase<T>(
  key: any[] | null,
  fetcherFn: () => Promise<any>
) {
  return useSWR<T, Error>(key, async () => {
    const response = await fetcherFn();
    return response.data; 
  }, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, 
  });
}