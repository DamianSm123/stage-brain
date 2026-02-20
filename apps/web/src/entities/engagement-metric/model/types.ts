export type EngagementTrend = "rising" | "stable" | "falling";

export interface EngagementMetric {
  timestamp: string;
  score: number;
  trend: EngagementTrend;
  event_type?: string;
}
