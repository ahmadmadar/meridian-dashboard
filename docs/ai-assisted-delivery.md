# AI-Assisted Delivery Log

This project was built using an AI-assisted delivery workflow — Claude Code
(CLI) handled scaffolding and screen implementation drafts, while
architecture decisions, design walkthroughs, and review remained a
human-in-the-loop process, per the "Session workflow" codified in
`CLAUDE.md`. This doc makes that split explicit for the dashboard,
parallel to the equivalent log in the sibling `meridian-fde-enterprise-demo`
repo (`docs/ai-assisted-delivery.md` there) — kept as its own file rather
than appended to that one, matching the two repos' deliberate independence
(see this repo's `CLAUDE.md`, "What this project is").

**Tool:** Claude Code (CLI)
**Version control:** GitHub Desktop
**Model of engagement:** one screen per session (`CLAUDE.md`'s "Session
workflow") — read `CLAUDE.md`, design walkthrough before code (which MCP
tool(s), loading/error states, layout), implement following the hard
technical conventions, verify against the real deployed server (`npm run
build`/`lint` clean, then the dev server against live data, hand-checked
against what the tool actually returned), update "Current build status"
and "Next steps" in `CLAUDE.md`, commit via GitHub Desktop.

---

## What Claude Code generated

- [x] `create-next-app` scaffold (TypeScript, Tailwind, App Router, `src/`
      layout)
- [x] `src/lib/mcp-client.ts` — server-only MCP client wrapper
- [x] `src/lib/types.ts` — shared result types per tool
- Screens:
  - [x] Renewal Risk (`/renewal-risk`) — `get_renewal_risk`
  - [x] Incidents (`/incidents`, `/incidents/[id]`) — `list_active_incidents`,
        `check_incident_impact`
  - [ ] Tickets — not started
  - [ ] Account drill-down — not started
  - [ ] Chat — not started

## What required architectural decisions

- `mcp-client.ts`'s connection pattern: one `Client` connection opened and
  closed per call, matching the server's own per-request `buildServer()`
  pattern, since the server runs `StreamableHTTPServerTransport` in
  stateless mode and holds no session between requests anyway. Sends the
  `dashboard-readonly` key as `x-api-key`, matching `authenticate()` in the
  server repo's `scopes.ts` — not `Authorization`.
- Guarding `mcp-client.ts` with `import "server-only"` as the actual
  enforcement mechanism behind "the dashboard-readonly key must stay
  server-side only" — an accidental import from client code becomes a
  build error rather than a runtime leak.
- Screens are Server Components calling `callMcpTool` directly, no
  intermediate `/api` proxy route — reserved for when a screen genuinely
  needs client-side interactivity a route handler would serve better (the
  future chat feature), not added "for consistency" on read-only screens.
- Every data route set `force-dynamic` — dashboard data must be current,
  not statically prerendered at build time.
- Errors surfaced as structured `McpToolError` with the server's own
  `.code` (`NOT_FOUND`, `VALIDATION_ERROR`, `FORBIDDEN_SCOPE`, `CONFLICT`,
  `UNAUTHORIZED`, `INTERNAL_ERROR`), caught per-screen and rendered as an
  inline message rather than a crashed page.
- No fallback values for env vars: `requireEnv()` throws on a missing
  `MCP_SERVER_URL`/`MCP_KEY_DASHBOARD` rather than defaulting via `||`,
  the same fail-closed pattern as the server repo's `scopes.ts`.
- Incidents drill-in: confirmed with the user in the design walkthrough
  (`CLAUDE.md` explicitly flagged this as unscoped) rather than assuming
  an interaction. Chose a separate `/incidents/[id]` Server Component
  route over a client-side expand-in-place, since the latter would need
  the `/api` proxy route and Client Component boundary the read-only
  screens deliberately avoid, for no real UX gain over a normal
  navigation.
- Incidents list filter UI: declined for v1, matching Renewal Risk's
  no-filter precedent — calls `list_active_incidents` with `{}` and
  renders the server's own default (non-RESOLVED statuses, limit 50).
  Weighed a severity filter (surfaces the SEV1 headline stat) against the
  precedent and against `CLAUDE.md` treating "decide filter UI" as its
  own explicit design step for the *Tickets* screen specifically, not
  Incidents; user chose to hold to precedent for now.
- `check_incident_impact`'s `NOT_FOUND` gets its own inline message
  ("No incident found for id …") on the detail page, rather than reusing
  the generic `${code}: ${message}` string the list page's error state
  uses — a bad id in the URL bar is a distinct, expected case from a
  genuine tool or connectivity failure.

## What Claude Code got wrong

> **Issue:** During the scaffold + Renewal Risk session, the real
> `dashboard-readonly` key was briefly pasted into `.env.example` — the
> file deliberately un-ignored in `.gitignore` (`!.env.example`)
> specifically so it gets committed as documentation — instead of the
> gitignored `.env.local`.
> **Caught by:** Manual review before anything was committed to this repo.
> **Fix:** Swapped the values (real key into `.env.local`, placeholder
> into `.env.example`). Also cross-logged in the server repo's
> `docs/ai-assisted-delivery.md` (Day 6 entry), written before this repo
> had its own delivery log.
> **Verification:** `git check-ignore -v .env.local .env.example`
> confirmed `.env.local` is ignored and `.env.example` is not — now a
> standing pre-commit check written into this repo's `CLAUDE.md` for any
> future change to either file.

> **Issue:** The Incidents screen's new nav-bar and home-page links to
> `/incidents` were first written as plain `<a>` elements.
> **Caught by:** `npm run lint` — `@next/next/no-html-link-for-pages`.
> **Fix:** Switched both to `next/link`'s `<Link>` component in
> `src/app/page.tsx` and the nav in `src/app/layout.tsx`.
> **Verification:** `npm run lint` and `npm run build` both clean
> afterward.

## Engagement log

- **Session 1 — Scaffold + Renewal Risk:** Scaffolded with
  `create-next-app` (TypeScript, Tailwind, App Router, `src/` layout).
  Built `src/lib/mcp-client.ts`, wrapping the official SDK's `Client` +
  `StreamableHTTPClientTransport`, one connection opened and closed per
  call, matching the server's stateless per-request `buildServer()`
  pattern; guarded with `server-only`. Built the Renewal Risk screen
  (`/renewal-risk`), calling `get_renewal_risk` with no filters and
  rendering the full default result as a table with a color-coded
  high/medium/low risk badge. Verified `npm run build`/`lint` clean, then
  against live data from the deployed Render server
  (`https://meridian-mcp-server-k4ki.onrender.com`). Caught the
  `.env.example` near-miss above before the first commit.
- **Session 2 — Incidents screen:** Read `list_active_incidents.ts` and
  `check_incident_impact.ts` from the sibling
  `meridian-fde-enterprise-demo` repo as the source of truth for both
  tools' shapes, per `CLAUDE.md`. Design walkthrough before code:
  confirmed with the user that the incident drill-in should be a
  separate `/incidents/[id]` Server Component route, and — after
  listing the pros/cons of a severity filter on request — that the
  incidents list should carry no filter UI for v1, matching Renewal
  Risk's precedent. Built `/incidents` (`list_active_incidents`, no
  filters) and `/incidents/[id]` (`check_incident_impact`), extended
  `src/lib/types.ts` with the new result shapes, added nav-bar and
  home-page links. `npm run lint` caught the `<a>`-vs-`next/link` issue
  above; fixed and reran clean. Verified end-to-end against the live
  deployed server: the one active SEV2 incident ("API latency
  degradation — us-east region") listed correctly with 0 SEV1s; the
  detail page's 6 affected accounts summed to exactly the list page's
  $65,718 MRR-impacted figure; a bogus incident id rendered the inline
  "No incident found" message instead of the generic error string.
  Updated `CLAUDE.md`'s "Current build status" and "Next steps" before
  ending the session. Started this log itself as its own file after the
  user asked whether dashboard work should log into the server repo's
  `docs/ai-assisted-delivery.md` or get its own — decided on a parallel
  file here, consistent with the repos' existing separation.
