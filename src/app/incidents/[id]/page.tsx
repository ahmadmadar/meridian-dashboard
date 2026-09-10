import Link from "next/link";
import { callMcpTool, McpToolError } from "@/lib/mcp-client";
import type { CheckIncidentImpactResult, IncidentSeverity, IncidentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const SEVERITY_BADGE_CLASSES: Record<IncidentSeverity, string> = {
  SEV1: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  SEV2: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SEV3: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

const STATUS_BADGE_CLASSES: Record<IncidentStatus, string> = {
  INVESTIGATING: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  IDENTIFIED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  MONITORING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data: CheckIncidentImpactResult;
  try {
    data = await callMcpTool<CheckIncidentImpactResult>("check_incident_impact", { incident_id: id });
  } catch (err) {
    const isNotFound = err instanceof McpToolError && err.code === "NOT_FOUND";
    const message = err instanceof McpToolError ? `${err.code}: ${err.message}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/incidents" className="text-sm text-foreground/60 hover:underline">
          ← Incidents
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Incident</h1>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {isNotFound ? `No incident found for id "${id}".` : `Failed to load incident: ${message}`}
        </p>
      </div>
    );
  }

  const { incident } = data;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/incidents" className="text-sm text-foreground/60 hover:underline">
        ← Incidents
      </Link>

      <div className="mt-2 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{incident.title}</h1>
        <p className="text-sm text-foreground/60">
          {data.account_count} accounts affected · {formatUsd(data.total_mrr_impacted_usd)} MRR impacted
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASSES[incident.severity]}`}>
          {incident.severity}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[incident.status]}`}>
          {incident.status}
        </span>
        <span className="text-sm text-foreground/60">
          Started {new Date(incident.started_at).toLocaleString()}
          {incident.resolved_at ? ` · Resolved ${new Date(incident.resolved_at).toLocaleString()}` : ""}
        </span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
              <th className="py-2 pr-4 font-medium">Account</th>
              <th className="py-2 pr-4 font-medium">Plan</th>
              <th className="py-2 pr-4 font-medium">MRR</th>
              <th className="py-2 pr-4 font-medium">Health</th>
            </tr>
          </thead>
          <tbody>
            {data.affected_accounts.map((account) => (
              <tr key={account.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">{account.name}</td>
                <td className="py-2 pr-4">{account.plan_tier}</td>
                <td className="py-2 pr-4">{formatUsd(account.mrr_usd)}</td>
                <td className="py-2 pr-4">{account.health_score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.affected_accounts.length === 0 && (
          <p className="py-8 text-center text-foreground/60">No accounts affected by this incident.</p>
        )}
      </div>
    </div>
  );
}
