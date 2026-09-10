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

export type TicketStatus = "OPEN" | "INVESTIGATING" | "ESCALATED" | "RESOLVED" | "CLOSED";
export type TicketPriority = "P1" | "P2" | "P3" | "P4";
export type SlaRisk = "breached" | "at_risk" | "ok";

export interface TicketSummary {
  id: string;
  account_id: string;
  account_name: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  sla_deadline: string;
  sla_breached: boolean;
}

export interface SearchTicketsResult {
  tickets: TicketSummary[];
  count: number;
  sla_breach_count: number;
}

export interface AccountUsage {
  last_active: string;
  trend: string;
  feature_flags: Record<string, boolean>;
}

export interface AccountOpenTicket {
  id: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  sla_deadline: string;
  sla_breached: boolean;
}

export interface AccountActiveIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
}

export interface GetAccount360Result {
  account: {
    id: string;
    name: string;
    plan_tier: string;
    mrr_usd: number;
    health_score: number;
    renewal_date: string;
    seat_utilization: string;
  };
  usage: AccountUsage | null;
  open_tickets: AccountOpenTicket[];
  sla_breach_count: number;
  active_incidents: AccountActiveIncident[];
}
