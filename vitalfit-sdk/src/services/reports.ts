import { Client } from '@/client';
import type {
  BillingMatrix,
  ChartData,
  ClassCapacityStats,
  ClassScheduleItem,
  CohortRetention,
  DataResponse,
  FinancialSummary,
  HeatmapPoint,
  KPICard,
  RecentAttendanceItem,
  RFMMetric,
  StackedChartData,
  TopBranch,
  TotalSalesStats,
} from '@/types';

export class ReportService {
  client: Client;
  constructor(client: Client) {
    this.client = client;
    this.mostUsedServices = this.mostUsedServices.bind(this);
    this.salesByCategory = this.salesByCategory.bind(this);
    this.salesByHour = this.salesByHour.bind(this);
    this.salesByPaymentMethod = this.salesByPaymentMethod.bind(this);
    this.topInstructors = this.topInstructors.bind(this);
    this.topBranches = this.topBranches.bind(this);
    this.globalStats = this.globalStats.bind(this);
    this.totalActiveBranches = this.totalActiveBranches.bind(this);
    this.totalClients = this.totalClients.bind(this);
    this.totalSales = this.totalSales.bind(this);
    this.todayCheckIns = this.todayCheckIns.bind(this);
    this.currentOccupancy = this.currentOccupancy.bind(this);
    this.classCapacityRatio = this.classCapacityRatio.bind(this);
    this.upcomingClassesToday = this.upcomingClassesToday.bind(this);
    this.recentCheckIns = this.recentCheckIns.bind(this);
    this.newClientsKPI = this.newClientsKPI.bind(this);
    this.retentionRateKPI = this.retentionRateKPI.bind(this);
    this.cohortAnalysis = this.cohortAnalysis.bind(this);
    this.newVsRecurringChart = this.newVsRecurringChart.bind(this);
    this.instructorNextClass = this.instructorNextClass.bind(this);
    this.instructorStudentCountKPI = this.instructorStudentCountKPI.bind(this);
    this.instructorMonthlyClassesCount =
      this.instructorMonthlyClassesCount.bind(this);
    this.instructorClassesToday = this.instructorClassesToday.bind(this);
    this.instructorStudentsToday = this.instructorStudentsToday.bind(this);
    this.instructorAttendanceRate = this.instructorAttendanceRate.bind(this);
    this.weeklyRevenueKPI = this.weeklyRevenueKPI.bind(this);
    this.monthlyRecurringRevenueKPI =
      this.monthlyRecurringRevenueKPI.bind(this);
    this.accountsReceivableKPI = this.accountsReceivableKPI.bind(this);
    this.averageTicketKPI = this.averageTicketKPI.bind(this);
    this.monthlyRevenueChart = this.monthlyRevenueChart.bind(this);
    this.billingByBranchMatrix = this.billingByBranchMatrix.bind(this);
    this.totalTransactionsKPI = this.totalTransactionsKPI.bind(this);
    this.monthlyCashFlowChart = this.monthlyCashFlowChart.bind(this);
    this.averageCLVKPI = this.averageCLVKPI.bind(this);
    this.monthlySalesKPI = this.monthlySalesKPI.bind(this);
    this.activeMembersKPI = this.activeMembersKPI.bind(this);
    this.occupancyKPI = this.occupancyKPI.bind(this);
    this.weeklySalesChart = this.weeklySalesChart.bind(this);
    this.activityHeatmap = this.activityHeatmap.bind(this);
    this.classOccupancyChart = this.classOccupancyChart.bind(this);
    this.financialSummary = this.financialSummary.bind(this);
    this.salesByDemography = this.salesByDemography.bind(this);
    this.churnRateKPI = this.churnRateKPI.bind(this);
    this.rfmAnalysis = this.rfmAnalysis.bind(this);
  }
  async mostUsedServices(
    jwt: string,
    start: string,
    end: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/most-used-services',
      jwt,
      params: {
        start,
        end,
      },
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async salesByCategory(
    jwt: string,
    start: string,
    end: string,
    branchId?: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/sales-by-category',
      jwt,
      params: {
        start,
        end,
        ...(branchId ? { branch_id: branchId } : {}),
      },
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async salesByHour(
    jwt: string,
    start: string,
    end: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/sales-by-hour',
      jwt,
      params: {
        start,
        end,
      },
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async salesByPaymentMethod(
    jwt: string,
    start: string,
    end: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/sales-by-payment-method',
      jwt,
      params: {
        start,
        end,
      },
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async topInstructors(
    jwt: string,
    start: string,
    end: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/top-instructors',
      jwt,
      params: {
        start,
        end,
      },
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async topBranches(jwt: string): Promise<DataResponse<TopBranch[]>> {
    const response = await this.client.get({
      url: '/reports/stats/top-branches',
      jwt,
    });
    return response as unknown as DataResponse<TopBranch[]>;
  }
  async globalStats(jwt: string): Promise<DataResponse<TopBranch[]>> {
    const response = await this.client.get({
      url: '/reports/stats/global',
      jwt,
    });
    return response as unknown as DataResponse<TopBranch[]>;
  }
  async totalActiveBranches(jwt: string): Promise<DataResponse<number>> {
    const response = await this.client.get({
      url: '/reports/stats/total-active-branches',
      jwt,
    });
    return response as unknown as DataResponse<number>;
  }
  async totalClients(jwt: string): Promise<DataResponse<number>> {
    const response = await this.client.get({
      url: '/reports/stats/total-clients',
      jwt,
    });
    return response as unknown as DataResponse<number>;
  }
  async totalSales(jwt: string): Promise<DataResponse<TotalSalesStats>> {
    const response = await this.client.get({
      url: '/reports/stats/total-sales',
      jwt,
    });
    return response as unknown as DataResponse<TotalSalesStats>;
  }
  async todayCheckIns(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<number>> {
    const response = await this.client.get({
      url: '/reports/stats/check-ins-today',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<number>;
  }
  async currentOccupancy(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<number>> {
    const response = await this.client.get({
      url: '/reports/stats/current-occupancy',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<number>;
  }
  async classCapacityRatio(
    jwt: string,
    classId: string,
  ): Promise<DataResponse<ClassCapacityStats>> {
    const response = await this.client.get({
      url: '/reports/stats/class-capacity',
      jwt,
      params: { class_id: classId },
    });
    return response as unknown as DataResponse<ClassCapacityStats>;
  }
  async upcomingClassesToday(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<ClassScheduleItem[]>> {
    const response = await this.client.get({
      url: '/reports/stats/upcoming-classes',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<ClassScheduleItem[]>;
  }
  async recentCheckIns(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<RecentAttendanceItem[]>> {
    const response = await this.client.get({
      url: '/reports/stats/recent-check-ins',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<RecentAttendanceItem[]>;
  }
  async newClientsKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/new-clients',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async retentionRateKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/retention-rate',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async cohortAnalysis(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<CohortRetention[]>> {
    const response = await this.client.get({
      url: '/reports/charts/cohort-analysis',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<CohortRetention[]>;
  }
  async newVsRecurringChart(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<StackedChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/new-vs-recurring',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<StackedChartData[]>;
  }
  async instructorNextClass(jwt: string): Promise<DataResponse<string>> {
    const response = await this.client.get({
      url: '/reports/instructors/next-class',
      jwt,
    });
    return response as unknown as DataResponse<string>;
  }
  async instructorStudentCountKPI(jwt: string): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/instructors/student-count',
      jwt,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async instructorMonthlyClassesCount(
    jwt: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/instructors/classes-count',
      jwt,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async instructorClassesToday(
    jwt: string,
  ): Promise<DataResponse<ClassScheduleItem[]>> {
    const response = await this.client.get({
      url: '/reports/instructors/classes-today',
      jwt,
    });
    return response as unknown as DataResponse<ClassScheduleItem[]>;
  }
  async instructorStudentsToday(jwt: string): Promise<DataResponse<number>> {
    const response = await this.client.get({
      url: '/reports/instructors/students-today',
      jwt,
    });
    return response as unknown as DataResponse<number>;
  }
  async instructorAttendanceRate(jwt: string): Promise<DataResponse<number>> {
    const response = await this.client.get({
      url: '/reports/instructors/attendance-rate',
      jwt,
    });
    return response as unknown as DataResponse<number>;
  }
  async weeklyRevenueKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/weekly-revenue',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async monthlyRecurringRevenueKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/mrr',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async accountsReceivableKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/accounts-receivable',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async averageTicketKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/average-ticket',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async monthlyRevenueChart(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/monthly-revenue',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async billingByBranchMatrix(
    jwt: string,
    start?: string,
    end?: string,
  ): Promise<DataResponse<BillingMatrix>> {
    const response = await this.client.get({
      url: '/reports/kpi/billing-matrix',
      jwt,
      params: {
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
      },
    });
    return response as unknown as DataResponse<BillingMatrix>;
  }
  async totalTransactionsKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/total-transactions',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async monthlyCashFlowChart(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/cash-flow',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async averageCLVKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/clv',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async monthlySalesKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/monthly-sales',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async activeMembersKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/active-members',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async occupancyKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/occupancy',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async weeklySalesChart(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/weekly-sales',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async activityHeatmap(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<HeatmapPoint[]>> {
    const response = await this.client.get({
      url: '/reports/charts/activity-heatmap',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<HeatmapPoint[]>;
  }
  async classOccupancyChart(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/class-occupancy',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async financialSummary(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<FinancialSummary>> {
    const response = await this.client.get({
      url: '/reports/kpi/financial-summary',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<FinancialSummary>;
  }
  async salesByDemography(
    jwt: string,
    branchId: string | undefined,
    dimension: 'age' | 'gender',
    start?: string,
    end?: string,
  ): Promise<DataResponse<ChartData[]>> {
    const response = await this.client.get({
      url: '/reports/charts/sales-by-demographics',
      jwt,
      params: {
        dimension,
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
      },
    });
    return response as unknown as DataResponse<ChartData[]>;
  }
  async churnRateKPI(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<KPICard>> {
    const response = await this.client.get({
      url: '/reports/kpi/churn-rate',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<KPICard>;
  }
  async rfmAnalysis(
    jwt: string,
    branchId?: string,
  ): Promise<DataResponse<RFMMetric[]>> {
    const response = await this.client.get({
      url: '/reports/analysis/rfm',
      jwt,
      params: branchId ? { branch_id: branchId } : undefined,
    });
    return response as unknown as DataResponse<RFMMetric[]>;
  }
}
