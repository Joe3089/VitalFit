export type DateRangeParams = {
  /** YYYY-MM-DD, defaults to 30 days ago */
  start?: string;
  /** YYYY-MM-DD (inclusive), defaults to today */
  end?: string;
  branch_id?: string;
};

export type ConversionStats = {
  visitors: number;
  signups: number;
  checkouts: number;
  purchases: number;
  signup_rate: number;
  conversion_rate: number;
  daily: {
    day: string;
    visitors: number;
    signups: number;
    purchases: number;
  }[];
};

export type WebEventType = 'visit' | 'signup' | 'checkout' | 'purchase';

export type NPSBranch = {
  branch_id: string | null;
  branch_name: string;
  responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  average_score: number;
  nps: number;
};

export type NPSSummary = NPSBranch & {
  by_branch: NPSBranch[];
  recent_comments: {
    score: number;
    comment: string;
    branch_name: string;
    created_at: string;
  }[];
  monthly: {
    month: string;
    responses: number;
    promoters: number;
    detractors: number;
    nps: number;
  }[];
};

export type RevPASRow = {
  branch_id: string;
  branch_name: string;
  service_id?: string;
  service_name?: string;
  revenue: number;
  available_spaces: number;
  booked_spaces: number;
  occupancy_rate: number;
  revpas: number;
};

export type RevPASReport = {
  revenue: number;
  available_spaces: number;
  revpas: number;
  by_branch: RevPASRow[];
  by_service: RevPASRow[];
};

export type BenchmarkMetric =
  | 'revenue'
  | 'new_clients'
  | 'active_members'
  | 'check_ins'
  | 'occupancy_rate'
  | 'nps';

export type BenchmarkRow = {
  branch_id: string;
  branch_name: string;
  revenue: number;
  new_clients: number;
  active_members: number;
  check_ins: number;
  capacity: number;
  booked: number;
  occupancy_rate: number;
  nps: number | null;
  indexes: Partial<Record<BenchmarkMetric, number>>;
  score: number;
  rank: number;
  best_in: BenchmarkMetric[];
};

export type BenchmarkReport = {
  branches: BenchmarkRow[];
  network_average: Partial<Record<BenchmarkMetric, number>>;
};

export type ChurnRiskClient = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  risk_score: number;
  factors: string[];
  preferred_branch_id: string | null;
};

export type KPIAlertSeverity = 'low' | 'medium' | 'high';

export type KPIAlert = {
  alert_id: string;
  branch_id: string | null;
  branch_name: string;
  metric: 'revenue' | 'check_ins';
  severity: KPIAlertSeverity;
  message: string;
  observed_value: number;
  expected_value: number;
  z_score: number;
  alert_date: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
};

export type ReportType = 'financial' | 'sales' | 'clients' | 'benchmark';
export type ReportFormat = 'csv' | 'excel' | 'pdf';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export type ReportTemplate = {
  template_id: string;
  name: string;
  primary_color: string;
  header_text: string;
  footer_text: string;
  orientation: 'L' | 'P';
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ReportTemplateRequest = Omit<
  ReportTemplate,
  'template_id' | 'created_at' | 'updated_at'
>;

export type ReportSchedule = {
  schedule_id: string;
  name: string;
  report_type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  recipients: string[];
  branch_id: string | null;
  template_id: string | null;
  is_active: boolean;
  last_sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportScheduleRequest = {
  name: string;
  report_type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  recipients: string[];
  branch_id?: string;
  template_id?: string;
  is_active?: boolean;
};

export type ReportShareLink = {
  link_id: string;
  report_type: ReportType;
  format: ReportFormat;
  branch_id: string | null;
  template_id: string | null;
  period_start: string;
  period_end: string;
  expires_at: string;
  access_count: number;
  created_by: string | null;
  created_at: string;
};

export type ShareLinkRequest = {
  report_type: ReportType;
  format: ReportFormat;
  expires_in_hours: number;
  branch_id?: string;
  template_id?: string;
  start?: string;
  end?: string;
};

export type BIAPIKey = {
  key_id: string;
  name: string;
  key_prefix: string;
  created_by: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};
