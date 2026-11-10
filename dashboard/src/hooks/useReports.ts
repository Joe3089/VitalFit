import useSWR from "swr";
import { api } from "@/lib/sdk-config";
import { ChartData, GlobalStat, TopBranch } from "@vitalfit/sdk";

const reportFetcher = async (action: () => Promise<any>) => {
  try {
    const response = await action();
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const useSalesByCategory = (
  token: string | null,
  start: string,
  end: string
) => {
  const key = token && start && end ? ["salesByCategory", token, start, end] : null;
  const fetcher = () => api.report.salesByCategory(token || "", start, end);

  const { data, error, isLoading } = useSWR<ChartData[], Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};

export const useSalesByPaymentMethod = (
  token: string | null,
  start: string,
  end: string
) => {
  const key = token && start && end ? ["salesByPaymentMethod", token, start, end] : null;
  const fetcher = () => api.report.salesByPaymentMethod(token || "", start, end);

  const { data, error, isLoading } = useSWR<ChartData[], Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};

export const useSalesByHour = (
  token: string | null,
  start: string,
  end: string
) => {
  const key = token && start && end ? ["salesByHour", token, start, end] : null;
  const fetcher = () => api.report.salesByHour(token || "", start, end);

  const { data, error, isLoading } = useSWR<ChartData[], Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};

export const useTopInstructors = (
  token: string | null,
  start: string,
  end: string
) => {
  const key = token && start && end ? ["topInstructors", token, start, end] : null;
  const fetcher = () => api.report.topInstructors(token || "", start, end);

  const { data, error, isLoading } = useSWR<ChartData[], Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};

export const useTopBranches = (token: string | null) => {
  const key = token ? ["topBranches", token] : null;
  const fetcher = () => api.report.topBranches(token || "");

  const { data, error, isLoading } = useSWR<TopBranch[], Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};

export const useGlobalStats = (token: string | null) => {
  const key = token ? ["globalStats", token] : null;
  const fetcher = () => api.report.globalStats(token || "");
  
  const { data, error, isLoading } = useSWR<GlobalStat, Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};


export const useTotalActiveBranches = (token: string | null) => {
  const key = token ? ["totalActiveBranches", token] : null;
  const fetcher = () => api.report.totalActiveBranches(token || "");
  
  const { data, error, isLoading } = useSWR<number, Error>(key, () =>
    reportFetcher(fetcher)
  );

  return { data, isLoading, error };
};
