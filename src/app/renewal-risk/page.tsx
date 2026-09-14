import Link from "next/link";
import { callMcpTool, McpToolError } from "@/lib/mcp-client";
import type { GetRenewalRiskResult, RiskLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

const RISK_BADGE_CLASSES: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function healthScoreClasses(score: number): string {
  if (score >= 70) return "text-emerald-700 dark:text-emerald-400";
  if (score >= 40) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export default async function RenewalRiskPage() {
  let data: GetRenewalRiskResult;
  try {
    data = await callMcpTool<GetRenewalRiskResult>("get_renewal_risk", {});
  } catch (err) {
    const message = err instanceof McpToolError ? `${err.code}: ${err.message}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Renewal Risk</h1>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Failed to load renewal risk data: {message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Renewal Risk</h1>
        <p className="text-sm text-foreground/60">
          {data.count} accounts renewing within 90 days · {data.high_risk_count} high risk
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
              <th className="py-2 pr-4 font-medium">Account</th>
              <th className="py-2 pr-4 font-medium">Plan</th>
              <th className="py-2 pr-4 font-medium">MRR</th>
              <th className="py-2 pr-4 font-medium">Health</th>
              <th className="py-2 pr-4 font-medium">Renewal</th>
              <th className="py-2 pr-4 font-medium">Seats</th>
              <th className="py-2 pr-4 font-medium">Usage Trend</th>
              <th className="py-2 pr-4 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((account) => (
              <tr key={account.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <Link href={`/accounts/${account.id}`} className="hover:underline">
                    {account.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{account.plan_tier}</td>
                <td className="py-2 pr-4">{formatUsd(account.mrr_usd)}</td>
                <td className={`py-2 pr-4 font-medium ${healthScoreClasses(account.health_score)}`}>{account.health_score}</td>
                <td className="py-2 pr-4">{account.renewal_date}</td>
                <td className="py-2 pr-4">{account.seat_utilization}</td>
                <td className="py-2 pr-4">{account.usage_trend ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGE_CLASSES[account.risk_level]}`}>
                    {account.risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.accounts.length === 0 && (
          <p className="py-8 text-center text-foreground/60">No accounts renewing in the next 90 days.</p>
        )}
      </div>
    </div>
  );
}
