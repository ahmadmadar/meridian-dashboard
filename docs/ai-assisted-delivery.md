# AI-Assisted Delivery Log

This project was built using an AI-assisted delivery workflow: Claude Code
(CLI) handled scaffolding and screen implementation drafts, while
architecture decisions, design walkthroughs, and review remained a
human-in-the-loop process, per the "Session workflow" codified in
`CLAUDE.md`. This doc makes that split explicit for the dashboard,
parallel to the equivalent log in the sibling `meridian-fde-enterprise-demo`
repo (`docs/ai-assisted-delivery.md` there), kept as its own file rather
than appended to that one, matching the two repos' deliberate independence
(see this repo's `CLAUDE.md`, "What this project is").

**Tool:** Claude Code (CLI)
**Version control:** GitHub Desktop
**Model of engagement:** one screen per session (`CLAUDE.md`'s "Session
workflow"): read `CLAUDE.md`, design walkthrough before code (which MCP
tool(s), loading/error states, layout), implement following the hard
technical conventions, verify against the real deployed server (`npm run
build`/`lint` clean, then the dev server against live data, hand-checked
against what the tool actually returned), update "Current build status"
and "Next steps" in `CLAUDE.md`, commit via GitHub Desktop.

---

## What Claude Code generated

- [x] `create-next-app` scaffold (TypeScript, Tailwind, App Router, `src/`
      layout)
- [x] `src/lib/mcp-client.ts`: server-only MCP client wrapper
- [x] `src/lib/types.ts`: shared result types per tool
- Screens:
  - [x] Renewal Risk (`/renewal-risk`): `get_renewal_risk`
  - [x] Incidents (`/incidents`, `/incidents/[id]`): `list_active_incidents`,
        `check_incident_impact`
  - [x] Tickets (`/tickets`): `search_tickets`
  - [x] Account drill-down (`/accounts/[id]`): `get_account_360`
  - [x] Chat: scoped out (decision logged below, not built)
- [x] Deployed to Vercel: https://meridian-dashboard-kappa.vercel.app/

## What required architectural decisions

- `mcp-client.ts`'s connection pattern: one `Client` connection opened and
  closed per call, matching the server's own per-request `buildServer()`
  pattern, since the server runs `StreamableHTTPServerTransport` in
  stateless mode and holds no session between requests anyway. Sends the
  `dashboard-readonly` key as `x-api-key`, matching `authenticate()` in the
  server repo's `scopes.ts`, not `Authorization`.
- Guarding `mcp-client.ts` with `import "server-only"` as the actual
  enforcement mechanism behind "the dashboard-readonly key must stay
  server-side only": an accidental import from client code becomes a
  build error rather than a runtime leak.
- Screens are Server Components calling `callMcpTool` directly, no
  intermediate `/api` proxy route, reserved for when a screen genuinely
  needs client-side interactivity a route handler would serve better (the
  future chat feature), not added "for consistency" on read-only screens.
- Every data route set `force-dynamic`: dashboard data must be current,
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
  no-filter precedent: calls `list_active_incidents` with `{}` and
  renders the server's own default (non-RESOLVED statuses, limit 50).
  Weighed a severity filter (surfaces the SEV1 headline stat) against the
  precedent and against `CLAUDE.md` treating "decide filter UI" as its
  own explicit design step for the *Tickets* screen specifically, not
  Incidents; user chose to hold to precedent for now.
- `check_incident_impact`'s `NOT_FOUND` gets its own inline message
  ("No incident found for id …") on the detail page, rather than reusing
  the generic `${code}: ${message}` string the list page's error state
  uses: a bad id in the URL bar is a distinct, expected case from a
  genuine tool or connectivity failure.
- Tickets filter mechanism: I had Claude drive the filters entirely off
  URL search params via `next/form`, reading `searchParams` as a
  `Promise` (this Next version's convention; Claude confirmed it
  against `node_modules/next/dist/docs/` rather than assuming). No
  client component, no `/api` route, keeping with the other read-only
  screens.
- Tickets category filter: `Ticket.category` is a free-text schema
  column, not a real enum, but in practice the only values
  `search_tickets` ever sees come from `prisma/seed.ts`'s fixed 6-item
  list. Claude asked me to choose between a dropdown of those 6 values,
  free text, or dropping the filter for now; I chose the dropdown for
  UX consistency with the other typed filters, accepting that a 7th
  seeded category would be unreachable from this filter until the
  dropdown gets updated.
- Tickets invalid-filter handling: I had any unrecognized value on a
  filter param (bad status, bad category, etc.) silently dropped rather
  than passed through to `search_tickets`, falling back to that
  filter's unfiltered default, which avoids a `VALIDATION_ERROR`
  round-trip over a hand-edited or stale URL.
- Account drill-down entry points: `get_account_360` has no companion
  list/search tool, so `/accounts/[id]` is reachable only by id. Rather
  than leave it orphaned, I had Claude add cross-links from every place
  an account id already surfaces in the existing screens — Renewal
  Risk's account cell, Tickets' account cell, and the incident detail
  page's affected-accounts table — instead of adding a standalone
  accounts list screen or home-page link with nothing to point it at.
- `feature_flags` type: Claude read `prisma/schema.prisma` in the
  server repo before typing this field and caught that it's a JSON
  object of flag name to boolean, not a string array as
  `get_account_360`'s return shape might suggest at a glance; rendered
  as badges colored by the boolean rather than a plain list.
- No automated test suite: considered matching the sibling repo's
  `vitest` integration suite and declined. This repo has no business
  logic of its own to protect (no state mutations, no auth logic beyond
  forwarding a header), unlike the sibling's tested state machine and
  transactional audit logging, so a full integration suite isn't
  justified by the current risk surface. The one dashboard-specific
  piece of logic worth protecting, Tickets' URL-param validation
  (falling back to the unfiltered default on an invalid value), is a
  candidate for a small unit test if this gets picked up again, not a
  reason to build a full suite now.
- Chat: decided against building it, not deferred by default. The
  server repo alone already demonstrates the core FDE/SE signal end to
  end (tool design, auth/scopes, state-machine enforcement, transactional
  audit logging, a tested integration suite, live deployment, a
  documented delivery process), and the dashboard's own "moment that
  sells it" (the chained multi-tool-call scenario) is already proven
  live through Claude Desktop as the MCP client. Chat would not unlock a
  new capability, only add a second, largely separate skill
  demonstration (agent-loop/MCP-client engineering), at the cost of
  being the single largest, riskiest remaining scope item in either
  repo. Reframed the dashboard's read-only scope as an intentional
  design decision (an ops-visibility tool) rather than a limitation,
  since the write-capable "agent that can act" story is already told
  elsewhere. Full writeup and a "future addition" note (a minimal
  single-shot Q&A widget via the Claude Agent SDK, no persisted state,
  no streaming) went into the server repo's `docs/architecture.md`
  rather than this file, since it's a system-wide decision that also
  touches that repo's own stub doc.

## What Claude Code got wrong

> **Issue:** During the scaffold + Renewal Risk session, the real
> `dashboard-readonly` key was briefly pasted into `.env.example` (the
> file deliberately un-ignored in `.gitignore` via `!.env.example`,
> specifically so it gets committed as documentation) instead of the
> gitignored `.env.local`.
> **Caught by:** Manual review before anything was committed to this repo.
> **Fix:** Swapped the values (real key into `.env.local`, placeholder
> into `.env.example`). Also cross-logged in the server repo's
> `docs/ai-assisted-delivery.md` (Day 6 entry), written before this repo
> had its own delivery log.
> **Verification:** `git check-ignore -v .env.local .env.example`
> confirmed `.env.local` is ignored and `.env.example` is not; now a
> standing pre-commit check written into this repo's `CLAUDE.md` for any
> future change to either file.

> **Issue:** The Incidents screen's new nav-bar and home-page links to
> `/incidents` were first written as plain `<a>` elements.
> **Caught by:** `npm run lint` (`@next/next/no-html-link-for-pages`).
> **Fix:** Switched both to `next/link`'s `<Link>` component in
> `src/app/page.tsx` and the nav in `src/app/layout.tsx`.
> **Verification:** `npm run lint` and `npm run build` both clean
> afterward.

## Engagement log

- **Day 6, Scaffold + Renewal Risk:** Scaffolded with
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
- **Day 6, Incidents screen:** Read `list_active_incidents.ts` and
  `check_incident_impact.ts` from the sibling
  `meridian-fde-enterprise-demo` repo as the source of truth for both
  tools' shapes, per `CLAUDE.md`. Design walkthrough before code:
  confirmed with the user that the incident drill-in should be a
  separate `/incidents/[id]` Server Component route, and, after
  listing the pros/cons of a severity filter on request, that the
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
  ending the session. Started this log itself as its own file after I
  asked whether dashboard work should log into the server repo's
  `docs/ai-assisted-delivery.md` or get its own, and decided on a
  parallel file here, consistent with the repos' existing separation.
- **Day 6, Tickets screen:** I had Claude read `search_tickets.ts`
  and `constants.ts` from the sibling `meridian-fde-enterprise-demo`
  repo as the source of truth for the tool's shape, and cross-check
  `category` against `prisma/schema.prisma` (free-text column) and
  `prisma/seed.ts` (the 6 values actually seeded). We did the design
  walkthrough before code: Claude laid out the tool's input/output
  shape, the `next/form`-based filter mechanism, and the table/badge
  layout, then asked me to decide the category filter's UI per
  `CLAUDE.md`'s explicit callout, and I chose the dropdown-of-known-values
  option over free text or dropping it. Claude checked
  `node_modules/next/dist/docs/` per `AGENTS.md` for this version's
  `searchParams`-as-Promise convention and the `next/form` component
  before writing any code. It built `/tickets`, extended
  `src/lib/types.ts` with `TicketSummary`/`SearchTicketsResult`, and
  added the home-page nav link. `npm run build`/`lint` both came back
  clean. I had it verify end-to-end against the live deployed server:
  default view (46 tickets, 13 SLA breached); `priority=P1` isolated to
  exactly the P1 rows; `category=billing` isolated to exactly the
  billing rows; `sla_risk=breached` isolated to exactly the breached
  row; an invalid category value fell back to the unfiltered default
  instead of erroring. Updated `CLAUDE.md`'s "Current build status" and
  "Next steps."
- **Day 6, Account drill-down:** Claude read `get_account_360.ts` and
  `prisma/schema.prisma` from the sibling `meridian-fde-enterprise-demo`
  repo as source of truth, catching that `feature_flags` is a JSON
  object, not a string array. Design walkthrough before code: MCP tool,
  error states (`NOT_FOUND` inline message matching the incident detail
  precedent), and layout (header stats, nullable usage panel, open
  tickets table, active incidents table linking to `/incidents/[id]`),
  plus the entry-point decision above. Built `/accounts/[id]`, extended
  `src/lib/types.ts` with `GetAccount360Result` and friends, and added
  cross-links from Renewal Risk, Tickets, and the incident detail page.
  `npm run build`/`lint` both clean. Verified end-to-end against the
  live deployed server: every field on one real account hand-checked
  against the tool's raw JSON response (including feature-flag badge
  coloring and the "no active incidents" empty-state message), the
  `NOT_FOUND` path on a bogus id, and all three cross-links. Updated
  `CLAUDE.md`'s "Current build status" and "Next steps."
- **Day 6, Scope decision (chat):** Used a thinking session with Claude
  to reason through whether chat was actually necessary for this demo,
  rather than building it by default because it was next on the
  roadmap. Decided to skip it: the server repo alone already
  demonstrates the core FDE/SE signal end to end, and the chained
  multi-tool-call scenario that's the dashboard's own "moment that
  sells it" is already proven live via Claude Desktop as the MCP
  client, so chat would add a second, separate skill demonstration
  rather than unlock a new capability, at the cost of being the
  largest remaining scope item in either repo. I'm actively
  job-searching now, so deploying and finishing docs on what's already
  built outweighs that marginal signal. Had Claude update the server
  repo's `docs/architecture.md` (previously a stub) with a "Dashboard"
  section describing this repo's screens and MCP calls, a "Chat: scoped
  out" section with the full reasoning, and a "future addition" note (a
  minimal single-shot Q&A widget via the Claude Agent SDK, no persisted
  multi-turn state, no streaming, explicitly not committed work).
  Updated this repo's `CLAUDE.md` "Next steps" to reflect the decision
  and added Vercel deployment and a README rewrite as the next two
  items. Deployment itself and the README rewrite are picked up next
  session, not done yet.
- **Day 6, Deploy to Vercel + test suite decision:** Talked through
  whether this repo needed an automated test suite like the sibling's
  `vitest` integration suite, and decided against it: this dashboard has
  no business logic of its own to protect (no mutations, no auth logic
  beyond forwarding a header), unlike the sibling's tested state machine
  and audit logging, so a full suite isn't justified by the current risk
  surface. Logged the one dashboard-specific piece of logic that would
  be worth a small unit test if this gets picked up again (Tickets'
  URL-param validation, falling back to the unfiltered default on an
  invalid value) without building it now. Deployed to Vercel: imported
  the GitHub repo, set `MCP_SERVER_URL` and `MCP_KEY_DASHBOARD` directly
  in Vercel's project settings (never in a committed file), confirmed
  the build succeeded. Had Claude verify all four screens end-to-end
  against the live deployed MCP server, not just the build log:
  cross-checked `/renewal-risk`'s and `/tickets`' summary counts against
  fresh direct tool calls rather than assumed values, and confirmed the
  incident drill-in, account drill-down, and the `NOT_FOUND` error path
  on a bad account id all render correctly. Live at
  `https://meridian-dashboard-kappa.vercel.app/`. Updated `CLAUDE.md`'s
  "Current build status" and "Next steps" (README rewrite is now the
  only remaining item).
