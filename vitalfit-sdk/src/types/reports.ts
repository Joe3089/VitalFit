export type ChartData = {
  hour?: number;
  label: string;
  value: number;
};

export type TopBranch = {
  label: string;
  value: string;
  percent_change: number;
  status: string;
  trend: 'up' | 'down' | string;
};

export type GlobalStat = {
  percentage_change: number;
  total_current_month: number;
  total_last_month: number;
  trend: string;
};

export type GlobalSalesStats = {
  total_current_month: number;
  total_last_month: number;
  percentage_change: number;
  trend: string;
};

export type TotalSalesStats = {
  total_sales: number;
  percentage_change: number;
  trend: string;
};

export type BranchPerformance = {
  label: string;
  value: number;
  percent_change: number;
  status: string;
  trend: string;
};

export type KPICard = {
  title: string;
  value: number;
  trend_percent: number;
  trend_label: string;
  is_positive: boolean;
  target?: number;
};

export type HeatmapPoint = {
  day_of_week: number;
  hour: number;
  value: number;
};

export type FinancialSummaryItem = {
  category: string;
  amount: number;
};

export type FinancialSummary = {
  items: FinancialSummaryItem[];
  total: number;
};

export type ClassCapacityStats = {
  class_name: string;
  current_count: number;
  max_capacity: number;
  ratio: string;
};

export type ClassScheduleItem = {
  class_id: string;
  class_name: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
};

export type RecentAttendanceItem = {
  user_name: string;
  check_in_time: string;
  service_name: string;
};

export type BillingMatrixRow = {
  concept: string;
  values: Record<string, number>;
  total: number;
};

export type BillingMatrix = {
  branches: string[];
  rows: BillingMatrixRow[];
  totals: Record<string, number>;
  grand_total: number;
};

export type StackedChartData = {
  label: string;
  new: number;
  recurring: number;
};

export type CohortRetention = {
  cohort_month: string;
  cohort_size: number;
  retention: number[];
};

export type RFMMetric = {
  user_id: string;
  name: string;
  email: string;
  last_purchase: string | null;
  recency_days: number;
  frequency: number;
  monetary_total: number;
  r_score: number;
  f_score: number;
  m_score: number;
  segment: string;
};
