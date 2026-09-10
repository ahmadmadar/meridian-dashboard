import Link from "next/link";
import { callMcpTool, McpToolError } from "@/lib/mcp-client";
import type { IncidentSeverity, IncidentStatus, ListActiveIncidentsResult } from "@/lib/types";

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

export default async function IncidentsPage() {
  let data: ListActiveIncidentsResult;
  try {
    data = await callMcpTool<ListActiveIncidentsResult>("list_active_incidents", {});
  } catch (err) {
    const message = err instanceof McpToolError ? `${err.code}: ${err.message}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Incidents</h1>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Failed to load incidents: {message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Incidents</h1>
        <p className="text-sm text-foreground/60">
          {data.count} active incidents · {data.sev1_count} SEV1
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">Severity</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Started</th>
              <th className="py-2 pr-4 font-medium">Accounts Affected</th>
              <th className="py-2 pr-4 font-medium">MRR Impacted</th>
            </tr>
          </thead>
          <tbody>
            {data.incidents.map((incident) => (
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
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[incident.status]}`}>
                    {incident.status}
                  </span>
                </td>
                <td className="py-2 pr-4">{new Date(incident.started_at).toLocaleString()}</td>
                <td className="py-2 pr-4">{incident.affected_account_count}</td>
                <td className="py-2 pr-4">{formatUsd(incident.total_mrr_impacted_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.incidents.length === 0 && (
          <p className="py-8 text-center text-foreground/60">No active incidents.</p>
        )}
      </div>
    </div>
  );
}
