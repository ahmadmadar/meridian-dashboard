import Form from "next/form";
import Link from "next/link";
import { callMcpTool, McpToolError } from "@/lib/mcp-client";
import type { SearchTicketsResult, SlaRisk, TicketPriority, TicketStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TICKET_STATUSES: TicketStatus[] = ["OPEN", "INVESTIGATING", "ESCALATED", "RESOLVED", "CLOSED"];
const TICKET_PRIORITIES: TicketPriority[] = ["P1", "P2", "P3", "P4"];
const SLA_RISK_LEVELS: SlaRisk[] = ["breached", "at_risk", "ok"];

// Not a real enum in the schema (ticket.category is a free-text column) —
// this is just what the seed data populates. See search_tickets.ts in the
// server repo and prisma/seed.ts's `categories` list.
const TICKET_CATEGORIES = ["billing", "integration", "performance", "bug", "feature_request", "onboarding"];

const PRIORITY_BADGE_CLASSES: Record<TicketPriority, string> = {
  P1: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  P2: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  P3: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  P4: "bg-black/10 text-foreground/70 dark:bg-white/10",
};

const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  INVESTIGATING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ESCALATED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-black/10 text-foreground/70 dark:bg-white/10",
};

function isTicketStatus(value: string): value is TicketStatus {
  return (TICKET_STATUSES as string[]).includes(value);
}

function isTicketPriority(value: string): value is TicketPriority {
  return (TICKET_PRIORITIES as string[]).includes(value);
}

function isSlaRisk(value: string): value is SlaRisk {
  return (SLA_RISK_LEVELS as string[]).includes(value);
}

interface TicketsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;

  const statusParam = typeof params.status === "string" ? params.status : "";
  const priorityParam = typeof params.priority === "string" ? params.priority : "";
  const categoryParam = typeof params.category === "string" ? params.category : "";
  const slaRiskParam = typeof params.sla_risk === "string" ? params.sla_risk : "";
  const accountIdParam = typeof params.account_id === "string" ? params.account_id.trim() : "";

  const args: Record<string, unknown> = {};
  if (statusParam && isTicketStatus(statusParam)) args.status = statusParam;
  if (priorityParam && isTicketPriority(priorityParam)) args.priority = priorityParam;
  if (categoryParam && TICKET_CATEGORIES.includes(categoryParam)) args.category = categoryParam;
  if (slaRiskParam && isSlaRisk(slaRiskParam)) args.sla_risk = slaRiskParam;
  if (accountIdParam) args.account_id = accountIdParam;

  let data: SearchTicketsResult;
  try {
    data = await callMcpTool<SearchTicketsResult>("search_tickets", args);
  } catch (err) {
    const message = err instanceof McpToolError ? `${err.code}: ${err.message}` : (err as Error).message;
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Failed to load tickets: {message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <p className="text-sm text-foreground/60">
          {data.count} tickets · {data.sla_breach_count} SLA breached
        </p>
      </div>

      <Form action="/tickets" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={statusParam}
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          >
            <option value="">Active (default)</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Priority
          <select
            name="priority"
            defaultValue={priorityParam}
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          >
            <option value="">All</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            name="category"
            defaultValue={categoryParam}
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          >
            <option value="">All</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          SLA Risk
          <select
            name="sla_risk"
            defaultValue={slaRiskParam}
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          >
            <option value="">All</option>
            {SLA_RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Account ID
          <input
            type="text"
            name="account_id"
            defaultValue={accountIdParam}
            placeholder="acct_..."
            className="rounded-md border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/10"
          />
        </label>

        <button
          type="submit"
          className="rounded-md border border-black/10 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          Filter
        </button>
        <a
          href="/tickets"
          className="rounded-md px-4 py-1.5 text-sm text-foreground/60 hover:underline"
        >
          Clear filters
        </a>
      </Form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
              <th className="py-2 pr-4 font-medium">Account</th>
              <th className="py-2 pr-4 font-medium">Priority</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">SLA Deadline</th>
              <th className="py-2 pr-4 font-medium">SLA</th>
            </tr>
          </thead>
          <tbody>
            {data.tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <Link href={`/accounts/${ticket.account_id}`} className="hover:underline">
                    {ticket.account_name}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASSES[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[ticket.status]}`}>
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

        {data.tickets.length === 0 && (
          <p className="py-8 text-center text-foreground/60">No tickets match these filters.</p>
        )}
      </div>
    </div>
  );
}
