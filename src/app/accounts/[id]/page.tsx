import Link from "next/link";
import { callMcpTool, McpToolError } from "@/lib/mcp-client";
import type {
  GetAccount360Result,
  IncidentSeverity,
  IncidentStatus,
  TicketPriority,
  TicketStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const PRIORITY_BADGE_CLASSES: Record<TicketPriority, string> = {
  P1: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  P2: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  P3: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  P4: "bg-black/10 text-foreground/70 dark:bg-white/10",
};

const TICKET_STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  INVESTIGATING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ESCALATED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-black/10 text-foreground/70 dark:bg-white/10",
};

const SEVERITY_BADGE_CLASSES: Record<IncidentSeverity, string> = {
  SEV1: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  SEV2: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SEV3: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

const INCIDENT_STATUS_BADGE_CLASSES: Record<IncidentStatus, string> = {
  INVESTIGATING: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  IDENTIFIED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  MONITORING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data: GetAccount360Result;
  try {
    data = await callMcpTool<GetAccount360Result>("get_account_360", { account_id: id });
  } catch (err) {
    const isNotFound = err instanceof McpToolError && err.code === "NOT_FOUND";
    const message = err instanceof McpToolError ? `${err.code}: ${err.message}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mt-2 text-2xl font-semibold">Account</h1>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {isNotFound ? `No account found for id "${id}".` : `Failed to load account: ${message}`}
        </p>
      </div>
    );
  }

  const { account, usage, open_tickets, active_incidents } = data;
  const featureFlagEntries = usage ? Object.entries(usage.feature_flags) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{account.name}</h1>
        <p className="text-sm text-foreground/60">
          {data.sla_breach_count} SLA breached · {active_incidents.length} active incidents
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-foreground/60">Plan</dt>
          <dd className="mt-0.5">{account.plan_tier}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">MRR</dt>
          <dd className="mt-0.5">{formatUsd(account.mrr_usd)}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">Health Score</dt>
          <dd className="mt-0.5">{account.health_score}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">Renewal Date</dt>
          <dd className="mt-0.5">{account.renewal_date}</dd>
        </div>
        <div>
          <dt className="text-foreground/60">Seat Utilization</dt>
          <dd className="mt-0.5">{account.seat_utilization}</dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Usage</h2>
        {usage ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-foreground/60">Last Active</dt>
              <dd className="mt-0.5">{usage.last_active}</dd>
            </div>
            <div>
              <dt className="text-foreground/60">Trend</dt>
              <dd className="mt-0.5">{usage.trend}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-foreground/60">Feature Flags</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {featureFlagEntries.map(([flag, enabled]) => (
                  <span
                    key={flag}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      enabled
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-black/10 text-foreground/60 dark:bg-white/10"
                    }`}
                  >
                    {flag}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-foreground/60">No usage data recorded for this account.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Open Tickets</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
                <th className="py-2 pr-4 font-medium">Priority</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">SLA Deadline</th>
                <th className="py-2 pr-4 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody>
              {open_tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASSES[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_BADGE_CLASSES[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{ticket.category}</td>
                  <td className="py-2 pr-4">{new Date(ticket.sla_deadline).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    {ticket.sla_breached ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                        Breached
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {open_tickets.length === 0 && (
            <p className="py-8 text-center text-foreground/60">No open tickets for this account.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Active Incidents</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
                <th className="py-2 pr-4 font-medium">Incident</th>
                <th className="py-2 pr-4 font-medium">Severity</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {active_incidents.map((incident) => (
                <tr key={incident.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">
                    <Link href={`/incidents/${incident.id}`} className="hover:underline">
                      {incident.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASSES[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INCIDENT_STATUS_BADGE_CLASSES[incident.status]}`}>
                      {incident.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {active_incidents.length === 0 && (
            <p className="py-8 text-center text-foreground/60">No active incidents for this account.</p>
          )}
        </div>
      </section>
    </div>
  );
}
