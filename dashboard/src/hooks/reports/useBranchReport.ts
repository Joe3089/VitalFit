import { api } from "@/lib/sdk-config";
import { useReportBase } from "./useReportBase";
import { 
  KPICard, 
  ChartData, 
  HeatmapPoint, 
  FinancialSummary, 
  ClassCapacityStats,
  RecentAttendanceItem,
  ClassScheduleItem,
} from "@vitalfit/sdk";

export const useBranchReport = {

  useMonthlySalesKPI: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["branch", "monthlySalesKPI", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        } 
        return api.report.monthlySalesKPI(jwt, branchId);
      }
    ),

  useOccupancyKPI: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["branch", "occupancyKPI", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.occupancyKPI(jwt, branchId);
      }
    ),

  useFinancialSummary: (jwt: string | null, branchId?: string) =>
    useReportBase<FinancialSummary>(
      jwt ? ["branch", "financialSummary", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.financialSummary(jwt, branchId);
      }
    ),

  useActivityHeatmap: (jwt: string | null, branchId?: string) =>
    useReportBase<HeatmapPoint[]>(
      jwt ? ["branch", "activityHeatmap", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.activityHeatmap(jwt, branchId);
      }
    ),

  useClassOccupancyChart: (jwt: string | null, branchId?: string) =>
    useReportBase<ChartData[]>(
      jwt ? ["branch", "classOccupancy", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.classOccupancyChart(jwt, branchId);
      }
    ),

  useWeeklySalesChart: (jwt: string | null, branchId?: string) =>
    useReportBase<ChartData[]>(
      jwt ? ["branch", "weeklySales", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.weeklySalesChart(jwt, branchId);
      }
    ),

  useCheckInsToday: (jwt: string | null, branchId?: string) =>
    useReportBase<number>(
      jwt ? ["branch", "checkInsToday", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.todayCheckIns(jwt, branchId);
      }
    ),

  useCurrentOccupancyPercent: (jwt: string | null, branchId?: string) =>
    useReportBase<number>(
      jwt ? ["branch", "currentOccupancyPercent", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.currentOccupancy(jwt, branchId);
      }
    ),

  useClassCapacityRatio: (jwt: string | null, classId: string) =>
    useReportBase<ClassCapacityStats>(
      jwt ? ["branch", "classCapacity", jwt, classId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.classCapacityRatio(jwt, classId);
      }
    ),


  useRecentCheckIns: (jwt: string | null, branchId?: string) =>
    useReportBase<RecentAttendanceItem[]>(
      jwt ? ["branch", "recentCheckIns", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.recentCheckIns(jwt, branchId);
      }
    ),

  useUpcomingClasses: (jwt: string | null, branchId?: string) =>
    useReportBase<ClassScheduleItem[]>(
      jwt ? ["branch", "upcomingClasses", jwt, branchId] : null,
      () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.report.upcomingClassesToday(jwt, branchId);
      }
    ),
};