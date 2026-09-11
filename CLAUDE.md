@AGENTS.md

# CLAUDE.md

Context for Claude Code sessions on this project. Read this before making
changes: it captures decisions already made so they don't get
re-litigated or re-broken.

## What this project is

The read-only + chat dashboard for the Meridian MCP server. Sibling
project to `meridian-fde-enterprise-demo` (the MCP server itself), both
under `~/Documents/GitHub`. Deliberately its own repo, deployed
independently to Vercel (see that repo's `docs/architecture.md` for why
a monorepo was rejected). This repo has no code dependency on the server
repo; it only talks to the server's deployed `/mcp` HTTP endpoint. When a
tool's input/output shape is in question, the source of truth is that
tool's file in `meridian-fde-enterprise-demo/src/tools/`, not a guess.

## Repo structure

Standard `create-next-app` layout: TypeScript, Tailwind, App Router,
`src/` directory. `src/lib/` holds server-only utilities (the MCP
client); `src/app/` holds routes, one directory per screen.

## Hard technical conventions (don't deviate without discussion)

- **All MCP calls go through `src/lib/mcp-client.ts`.** It wraps the
  official `@modelcontextprotocol/sdk` `Client` +
  `StreamableHTTPClientTransport`, sending the `dashboard-readonly` key
  as the `x-api-key` header (matching `authenticate()` in the server
  repo's `src/auth/scopes.ts`, not `Authorization`). One `Client`
  connection per call, opened and closed within the call; this mirrors
  the server's own per-request `buildServer()` pattern, since the server
  runs `StreamableHTTPServerTransport` in stateless mode
  (`sessionIdGenerator: undefined`) and holds no session between
  requests anyway.
- **The file is guarded with `import "server-only"`.** This is not
  decorative: it makes any accidental import of `mcp-client.ts` from
  client-side code a build error, which is the actual enforcement
  mechanism behind "the dashboard-readonly key must stay server-side
  only." Don't remove the import, and don't call `callMcpTool` from a
  Client Component.
- **Screens are Server Components that call `callMcpTool` directly.** No
  intermediate API route unless a screen needs client-side interactivity
  that a route handler would serve better (e.g. the future chat feature).
  Don't add a `/api` proxy route "for consistency"; it's an unnecessary
  hop for a read-only screen.
- **Data routes are `force-dynamic`.** Dashboard data must be current,
  not statically prerendered at build time. Every screen's `page.tsx`
  sets `export const dynamic = "force-dynamic";` (see
  `src/app/renewal-risk/page.tsx`).
- **Errors are structured, not generic.** `callMcpTool` throws
  `McpToolError` with a `.code` taken from the server's own error
  envelope (`NOT_FOUND`, `VALIDATION_ERROR`, `FORBIDDEN_SCOPE`,
  `CONFLICT`, `UNAUTHORIZED`, `INTERNAL_ERROR`, the same codes as the
  server's `mapErrorToToolResult()`). Screens catch it and render an
  inline error message, not a crashed page (see the `try/catch` in
  `renewal-risk/page.tsx`).
- **No fallback values for env vars.** `mcp-client.ts`'s `requireEnv()`
  throws if `MCP_SERVER_URL` or `MCP_KEY_DASHBOARD` is missing, no `||`
  default; same fail-closed pattern as the server repo's `scopes.ts`.
  Don't reintroduce a fallback.
- **`.env.local` holds the real key; `.env.example` holds only a
  placeholder.** This bears repeating because it already went wrong
  once this session (real key briefly landed in `.env.example` before
  anything was committed; see the server repo's engagement log, Day 6).
  `.env.example` is deliberately un-ignored in `.gitignore`
  (`!.env.example`) specifically so it gets committed as documentation,
  which means a real secret pasted there would get pushed. Before
  committing any change to either file, run
  `git check-ignore -v .env.local .env.example` and confirm `.env.local`
  is ignored and `.env.example` is not.
- **The `dashboard-readonly` key has no `admin` scope.** It carries
  `read:accounts`, `read:tickets`, `read:incidents` only (see the server
  repo's `scopes.ts`). `get_audit_log` requires `admin` and is
  permanently out of reach for this dashboard: don't build an audit-log
  screen against this key; it will always fail `FORBIDDEN_SCOPE`.

## Version control

GitHub Desktop, not `gh` CLI, matching the server repo. Conventional
commit format (`feat:`, `fix:`, `docs:`, `test:`) in the commit summary
field.

## Session workflow

One screen per session, mirroring the server repo's one-tool-per-session
rule. Each session:

1. Read this file first.
2. Design walkthrough before code: which MCP tool(s) the screen calls,
   the loading/error states, and the layout, before writing it.
3. Implement, following the conventions above.
4. Verify against the real deployed server, not a mocked response:
   `npm run build`/`lint` clean, then the dev server against live data,
   with the rendered output hand-checked against what the tool actually
   returned (same bar the server repo holds for its own tools).
5. Update "Current build status" and "Next steps" below before ending
   the session.
6. Update `docs/ai-assisted-delivery.md` with this session's entry
   (generated/decisions/what-got-wrong/engagement log, per its existing
   format), written in the user's first-person voice, not "Claude Code
   did X": draft the update and show it to the user for review before
   writing it to the file. This applies to every edit of that doc, not
   just the initial draft. Engagement log entries are headed by
   calendar day (`Day N`), matching the sibling repo's dating
   convention, not by session count; confirm the current day with the
   user rather than assuming.
7. Commit via GitHub Desktop.

## Current build status

Scaffold done. Two screens built and verified live against the deployed
Render server (`https://meridian-mcp-server-k4ki.onrender.com`):

- **Renewal Risk** (`/renewal-risk`): calls `get_renewal_risk` with no
  filters, renders the full default result as a table with a
  color-coded risk badge (high/medium/low).
- **Incidents** (`/incidents`): calls `list_active_incidents` with no
  filters (server defaults to all non-RESOLVED, limit 50), renders a
  table with severity/status badges. Each row links to
  `/incidents/[id]`, a separate Server Component page that calls
  `check_incident_impact` for the account-level drill-in
  (affected accounts, MRR impacted, health scores). `NOT_FOUND` on a
  stale/bad id renders an inline "No incident found" message rather
  than the generic error string. No filter UI: matches Renewal Risk's
  precedent; revisit if incident volume ever exceeds the 50-row default.
- **Tickets** (`/tickets`): calls `search_tickets`, filters driven
  entirely by URL search params via `next/form` (GET, no client
  component, no API route; reads `searchParams` as a `Promise` per
  this Next version's convention). Status/priority/sla_risk are real
  enums from the server's `constants.ts`; category is **not** a real
  enum in the schema (`Ticket.category` is a free-text column) but the
  filter dropdown hardcodes the 6 values `prisma/seed.ts` actually
  populates. Chosen deliberately over free text for UX consistency
  with the other typed dropdowns; revisit if the server repo ever seeds
  a 7th category, since it'd silently be unreachable from this filter.
  An unrecognized/invalid query value for any filter is dropped rather
  than passed through, falling back to the unfiltered default. No
  limit UI, matching the other two screens' precedent. Verified live:
  default view (46 tickets/13 breached), and `priority`, `category`,
  `sla_risk` filters each isolate the correct subset against the
  deployed server.
- **Account drill-down** (`/accounts/[id]`): calls `get_account_360`
  with `account_id`, renders account header stats, a usage panel
  (nullable — renders a "no usage data" message when absent, since
  `ProductUsage` is an optional 1:1 relation), open tickets, and active
  incidents, each linking to `/incidents/[id]`. `feature_flags` is a
  JSON object of flag name to boolean (not an array, per the server
  repo's `schema.prisma`), rendered as badges colored by the boolean.
  No standalone list/search screen exists for accounts (no such tool),
  so it's reachable only by cross-links added to the account cells on
  Renewal Risk, Tickets, and the incident detail page's affected
  accounts table. `NOT_FOUND` renders an inline message like the
  incident detail page. Verified live against the deployed server: all
  fields hand-checked against the tool's raw JSON response for one
  account (including feature-flag badge coloring and the empty-state
  message when `active_incidents` is `[]`), plus the `NOT_FOUND` path
  and all three cross-links.

Deployed to Vercel: `https://meridian-dashboard-kappa.vercel.app/`.
`MCP_SERVER_URL`/`MCP_KEY_DASHBOARD` set directly in Vercel's project
settings, not in a committed file. Verified live (not just build-clean):
all four screens hand-checked against the deployed MCP server's actual
data, including `/renewal-risk` (6 accounts, 1 high risk) and
`/tickets` (46 tickets, 13 SLA breached) cross-checked directly against
a fresh `get_renewal_risk`/live tool call rather than assumed from
memory, plus the incident drill-in, the account drill-down, and the
`NOT_FOUND` error path on a bad account id.

## Next steps

Build order, read-only screens before chat (per the server repo's
`CLAUDE.md`, a materially bigger scope jump since chat makes this
dashboard its own MCP client running an agent loop):

1. ~~Renewal Risk~~: done.
2. ~~Incidents~~: done.
3. ~~Tickets~~: done.
4. ~~Account drill-down~~: done.
5. ~~Chat~~: scoped out, not deferred. Decided against building it: the
   project's core FDE/SE signal is already fully demonstrated by the
   server repo alone, and the dashboard's own "moment that sells it" is
   already proven live through Claude Desktop as the MCP client, so chat
   would add a second, separate skill demonstration rather than unlock
   a new capability, at the cost of being the single largest remaining
   scope item in either repo. Full reasoning and a "future addition"
   note (a minimal single-shot Q&A widget) live in the server repo's
   `docs/architecture.md`, "Chat: scoped out" section.
6. ~~Deploy to Vercel~~: done. Live at
   `https://meridian-dashboard-kappa.vercel.app/`, verified end-to-end
   against the deployed MCP server.
7. ~~README rewrite~~ — done. Project overview, live links (dashboard
   + MCP server), and a pointer to `docs/ai-assisted-delivery.md`.

No automated test suite planned. Considered and declined: this repo has
no business logic of its own to protect (no state mutations, no auth
logic beyond forwarding a header), unlike the sibling repo's tested
state machine and audit logging. The one piece of dashboard-specific
logic (Tickets' URL-param validation, silently falling back to the
unfiltered default on an invalid value) is a candidate for a small unit
test if this ever gets picked back up, but a full integration suite
isn't justified by the current risk surface. Revisit if real client-side
logic is ever added (chat would have been the trigger for that; it was
scoped out instead).
