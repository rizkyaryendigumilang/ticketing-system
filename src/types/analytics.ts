export interface TrendDataPoint {
  date: string;
  total: number;
  open: number;
  inProgress: number;
  solved: number;
}

export interface CategoryMetric {
  category: string;
  count: number;
  percentage: number;
}

export interface AppMetric {
  appId: string;
  appName: string;
  ticketCount: number;
  slaBreachedCount: number;
  avgResolutionHours: number;
}

export interface AnalyticsSummary {
  totalTickets: number;
  slaCompliancePercent: number;
  avgResolutionHours: number;
  csatAverage: number;
  trends: TrendDataPoint[];
  categories: CategoryMetric[];
  apps: AppMetric[];
}
