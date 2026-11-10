import { api } from "@/lib/sdk-config";
import { useReportBase } from "./useReportBase";
import { KPICard, ChartData,  CohortRetention, StackedChartData, RFMMetric } from "@vitalfit/sdk";

export const useClientReport = {

  useActiveMember: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["client", "activeMember", jwt, branchId] : null,
      () => {
        if (!jwt) {
            throw new Error("No JWT provided");
        }
        return api.report.activeMembersKPI(jwt, branchId);
      }
    ),

    useNewClients: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["client", "newClient", jwt, branchId] : null,
      () => {
        if (!jwt) {
            throw new Error("No JWT provided");
        }
        return api.report.newClientsKPI(jwt, branchId);
      }
    ),

    useRetentionRate: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["client", "retentionRate", jwt, branchId] : null,
      () => {
        if (!jwt) {
            throw new Error("No JWT provided");
        }
        return api.report.retentionRateKPI(jwt, branchId);
      }
    ),

    useTotalClients: (jwt: string | null ) =>
    useReportBase<number>(
      jwt ? ["client", "totalClient", jwt] : null,
      () => {
        if (!jwt) {
            throw new Error("No JWT provided");
        }
        return api.report.totalClients(jwt);
      }
    ),
    

    useCohortAnalysis : (jwt: string | null, branchId?: string ) =>
    useReportBase<CohortRetention[]>(
      jwt ? ["client", "cohortAnalysis", jwt, branchId] : null,
      () => {
        if (!jwt) {
            throw new Error("No JWT provided");
        }
        return api.report.cohortAnalysis(jwt, branchId);
      }
    ),
    
    useMostUsedServices: (jwt: string | null, start: string, end: string) =>
    useReportBase<ChartData[]>(
        jwt && start && end  ? ["client", "mostUsedServices", jwt, start, end] : null,
        () =>{
            if(!jwt){
                throw new Error("No JWT provided");
            }
            return api.report.mostUsedServices(jwt, start, end);
        }
    ),

    useNewVsRecurringChart: (jwt: string | null, branchId?: string) => 
        useReportBase<StackedChartData[]>(
        jwt ? ["client", "newVsRecurringChart", jwt, branchId] : null,
        () => {
            if(!jwt){
                throw new Error("No JWT provided");
            }
            return api.report.newVsRecurringChart(jwt, branchId);
        }
    ),

    useTopInstructorsByAttendance :(jwt: string | null,  start: string, end: string) =>
        useReportBase<ChartData[]>(
           jwt && start && end ? ["client", "topInstructor", jwt, start, end]: null,
            () =>{
                if(!jwt){
                    throw new Error("No JWT provided");
                }
                return api.report.topInstructors(jwt, start, end);
            }
        ),

   useChurnRateKPI: (jwt: string | null, branchId?: string) =>
    useReportBase<KPICard>(
      jwt ? ["client", "churnRateKPI", jwt, branchId] : null,
      () => {
        if (!jwt) {
            throw new Error("No JWT provided");
        }
        return api.report.churnRateKPI(jwt, branchId);
      }
    ),

    useRfmAnalysis: (jwt: string | null, branchId?: string) =>
    useReportBase<RFMMetric[]>(
      jwt ? ["client", "rfmAnalysis", jwt, branchId] : null,
      async () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
         return api.report.rfmAnalysis(jwt, branchId);
        
      }
    ),
};