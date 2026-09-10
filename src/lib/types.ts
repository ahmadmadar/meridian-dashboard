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

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3";
export type IncidentStatus = "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";

export interface ActiveIncidentSummary {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  started_at: string;
  affected_account_count: number;
  total_mrr_impacted_usd: number;
}

export interface ListActiveIncidentsResult {
  incidents: ActiveIncidentSummary[];
  count: number;
  sev1_count: number;
}

export interface IncidentImpactAccount {
  id: string;
  name: string;
  plan_tier: string;
  mrr_usd: number;
  health_score: number;
}

export interface CheckIncidentImpactResult {
  incident: {
    id: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    started_at: string;
    resolved_at: string | null;
  };
  affected_accounts: IncidentImpactAccount[];
  account_count: number;
  total_mrr_impacted_usd: number;
}
