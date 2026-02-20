export type RiskLevel = "low" | "medium" | "high";

export interface Recommendation {
  segment_id: string;
  segment_name: string;
  risk: RiskLevel;
  reason: string;
  expected_engagement_delta: number;
}

export interface RecoveryScenario {
  id: string;
  description: string;
  time_saved_seconds: number;
  risk: RiskLevel;
  impact: string;
  is_compound: boolean;
  actions: string[];
}
