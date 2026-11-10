import { api } from "@/lib/sdk-config";
import { useReportBase } from "./useReportBase";
import { ChartData, KPICard, TopBranch, TotalSalesStats } from "@vitalfit/sdk";

export const useSalesReports = {
  useTotalSales: (jwt: string | null) =>
    useReportBase<TotalSalesStats>(
      jwt ? ["sales", "totalSales", jwt] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.totalSales(jwt);
      }
    ),

  useAverageTicket: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["sales", "averageTicketKPI", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.averageTicketKPI(jwt, branchId);
      }
    ),

  useTotalTransactionsKPI: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["sales", "totalTransactionsKPI", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.totalTransactionsKPI(jwt, branchId);
      }
    ),

  useGlobalStats: (jwt: string | null) =>
    useReportBase<TopBranch[]>(
      jwt ? ["sales", "totalTransactionsKPI", jwt] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.globalStats(jwt);
      }
    ),

  useSalesByCategory: (jwt: string | null, start: string, end: string) =>
    useReportBase<ChartData[]>(
      jwt && start && end
        ? ["sales", "salesByCategory", jwt, start, end]
        : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.salesByCategory(jwt, start, end);
      }
    ),

  useSalesByPaymentMethod: (jwt: string | null, start: string, end: string) =>
    useReportBase<ChartData[]>(
      jwt && start && end
        ? ["sales", "salesByPaymentMethod", jwt, start, end]
        : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.salesByPaymentMethod(jwt, start, end);
      }
    ),

  useSalesByHour: (jwt: string | null, start: string, end: string) =>
    useReportBase<ChartData[]>(
      jwt && start && end ? ["sales", "salesByHour", jwt, start, end] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.salesByHour(jwt, start, end);
      }
    ),

  useTopBranches: (jwt: string | null) =>
    useReportBase<TopBranch[]>(
      jwt ? ["sales", "topBranches", jwt] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.topBranches(jwt);
      }
    ),

  useSalesByDemography: (
    jwt: string | null,
    branchId: string | undefined,
    dimension: "age" | "gender", 
    start: string, 
    end: string
  ) =>
    useReportBase<ChartData[]>(

      jwt
        ? ["sales", "salesByDemography", jwt, branchId, dimension, start, end]
        : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }

        return api.report.salesByDemography(
          jwt,
          branchId,
          dimension,
          start,
          end
        );
      }
    ),
};
