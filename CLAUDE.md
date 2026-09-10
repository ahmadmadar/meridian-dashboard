@AGENTS.md

# CLAUDE.md

Context for Claude Code sessions on this project. Read this before making
changes — it captures decisions already made so they don't get
re-litigated or re-broken.

## What this project is

The read-only + chat dashboard for the Meridian MCP server. Sibling
project to `meridian-fde-enterprise-demo` (the MCP server itself), both
under `~/Documents/GitHub`. Deliberately its own repo, deployed
independently to Vercel — see that repo's `docs/architecture.md` for why
a monorepo was rejected. This repo has no code dependency on the server
repo; it only talks to the server's deployed `/mcp` HTTP endpoint. When a
tool's input/output shape is in question, the source of truth is that
tool's file in `meridian-fde-enterprise-demo/src/tools/`, not a guess.

## Repo structure

Standard `create-next-app` layout: TypeScript, Tailwind, App Router,
`src/` directory. `src/lib/` holds server-only utilities (the MCP
client); `src/app/` holds routes, one directory per screen.

## Hard technical conventions — don't deviate without discussion

- **All MCP calls go through `src/lib/mcp-client.ts`.** It wraps the
  official `@modelcontextprotocol/sdk` `Client` +
  `StreamableHTTPClientTransport`, sending the `dashboard-readonly` key
  as the `x-api-key` header (matching `authenticate()` in the server
  repo's `src/auth/scopes.ts` — not `Authorization`). One `Client`
  connection per call, opened and closed within the call — this mirrors
  the server's own per-request `buildServer()` pattern, since the server
  runs `StreamableHTTPServerTransport` in stateless mode
  (`sessionIdGenerator: undefined`) and holds no session between
  requests anyway.
- **The file is guarded with `import "server-only"`.** This is not
  decorative — it makes any accidental import of `mcp-client.ts` from
  client-side code a build error, which is the actual enforcement
  mechanism behind "the dashboard-readonly key must stay server-side
  only." Don't remove the import, and don't call `callMcpTool` from a
  Client Component.
- **Screens are Server Components that call `callMcpTool` directly.** No
  intermediate API route unless a screen needs client-side interactivity
  that a route handler would serve better (e.g. the future chat feature).
  Don't add a `/api` proxy route "for consistency" — it's an unnecessary
  hop for a read-only screen.
- **Data routes are `force-dynamic`.** Dashboard data must be current,
  not statically prerendered at build time. Every screen's `page.tsx`
  sets `export const dynamic = "force-dynamic";` — see
  `src/app/renewal-risk/page.tsx`.
- **Errors are structured, not generic.** `callMcpTool` throws
  `McpToolError` with a `.code` taken from the server's own error
  envelope (`NOT_FOUND`, `VALIDATION_ERROR`, `FORBIDDEN_SCOPE`,
  `CONFLICT`, `UNAUTHORIZED`, `INTERNAL_ERROR` — same codes as the
  server's `mapErrorToToolResult()`). Screens catch it and render an
  inline error message, not a crashed page — see the `try/catch` in
  `renewal-risk/page.tsx`.
- **No fallback values for env vars.** `mcp-client.ts`'s `requireEnv()`
  throws if `MCP_SERVER_URL` or `MCP_KEY_DASHBOARD` is missing, no `||`
  default — same fail-closed pattern as the server repo's `scopes.ts`.
  Don't reintroduce a fallback.
- **`.env.local` holds the real key; `.env.example` holds only a
  placeholder.** This bears repeating because it already went wrong
  once this session (real key briefly landed in `.env.example` before
  anything was committed — see the server repo's engagement log, Day 6).
  `.env.example` is deliberately un-ignored in `.gitignore`
  (`!.env.example`) specifically so it gets committed as documentation
  — which means a real secret pasted there would get pushed. Before
  committing any change to either file, run
  `git check-ignore -v .env.local .env.example` and confirm `.env.local`
  is ignored and `.env.example` is not.
- **The `dashboard-readonly` key has no `admin` scope.** It carries
  `read:accounts`, `read:tickets`, `read:incidents` only (see the server
  repo's `scopes.ts`). `get_audit_log` requires `admin` and is
  permanently out of reach for this dashboard — don't build an audit-log
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
   the loading/error states, and the layout — before writing it.
3. Implement, following the conventions above.
4. Verify against the real deployed server, not a mocked response —
   `npm run build`/`lint` clean, then the dev server against live data,
   with the rendered output hand-checked against what the tool actually
   returned (same bar the server repo holds for its own tools).
5. Update "Current build status" and "Next steps" below before ending
   the session.
6. Commit via GitHub Desktop.

## Current build status

Scaffold done. One screen built and verified live against the deployed
Render server (`https://meridian-mcp-server-k4ki.onrender.com`):

- **Renewal Risk** (`/renewal-risk`) — calls `get_renewal_risk` with no
  filters, renders the full default result as a table with a
  color-coded risk badge (high/medium/low).

## Next steps

Build order, read-only screens before chat (per the server repo's
`CLAUDE.md`, a materially bigger scope jump since chat makes this
dashboard its own MCP client running an agent loop):

1. ~~Renewal Risk~~ — done.
2. **Incidents** — likely `list_active_incidents` for the list,
   `check_incident_impact` for a per-incident drill-in. Not yet scoped
   in detail; confirm the drill-in interaction in the design walkthrough
   before building.
3. **Tickets** — `search_tickets`. Decide filter UI (status, priority,
   category, sla_risk, account) in the design walkthrough.
4. **Account drill-down** — `get_account_360`.
5. **Chat** — after all read-only screens. Scope this properly before
   starting; it's a different kind of build (the dashboard backend
   becomes its own MCP client running an agent loop), not just another
   screen.
6. **Deploy to Vercel** — not yet done. When it happens, set
   `MCP_SERVER_URL` and `MCP_KEY_DASHBOARD` directly in Vercel's project
   settings, never in a committed file — same pattern as the server
   repo's Render deployment.

No automated test suite yet. Worth adding once more than one screen
exists and there's a real pattern to test against, rather than
scaffolding a test setup for a single page.
