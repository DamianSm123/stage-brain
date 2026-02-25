export type EngagementTrend = "rising" | "stable" | "falling";

export interface EngagementMetric {
  timestamp: string;
  score: number;
  trend: EngagementTrend;
  event_type?: string;
}

export interface TimestampedScore {
  timestamp: string; // ISO 8601
  score: number; // 0-100
}

export type AnnotationType = "marker" | "zone";

export interface ChartAnnotation {
  id: string;
  type: AnnotationType;
  timestamp: string;
  endTimestamp?: string;
  label: string;
  icon?: string;
  color?: string;
}
