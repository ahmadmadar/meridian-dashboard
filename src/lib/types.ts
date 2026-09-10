export type RiskLevel = "high" | "medium" | "low";

export interface RenewalRiskAccount {
  id: string;
  name: string;
  plan_tier: string;
  mrr_usd: number;
  health_score: number;
  renewal_date: string;
  seat_utilization: string;
  usage_trend: string | null;
  risk_level: RiskLevel;
}

export interface GetRenewalRiskResult {
  accounts: RenewalRiskAccount[];
  count: number;
  high_risk_count: number;
}
