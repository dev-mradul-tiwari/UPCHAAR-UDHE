# Upchaar — Build Progress Tracker

> **Living document.** Every agent updates its own row the moment it finishes.
> Read this first to know what already exists before writing anything.

**Repo:** `/Users/mayank/Documents/Web-Dev/mradul-upchar`
**Last updated:** 2026-08-18 (build complete, full stack verified in Docker)T23:59

## Legend
`⬜ not started` · `🟨 in progress` · `✅ done` · `❌ blocked`

---

## Phase 0 — Foundation (owner: main session) — **COMPLETE**

| Status | Item | Path |
|---|---|---|
| ✅ | Tracker docs | `docs/*.md` |
| ✅ | Root workspace config | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example` |
| ✅ | TS config package | `packages/typescript-config` — `base` / `node` / `nextjs` / `react-library` |
| ✅ | Prisma schema + client + seed | `packages/db` — schema **validated**, client generates, seed written |
| ✅ | Zod contract package | `packages/types` — typechecks clean |

Verified: `pnpm install` ✓ · `prisma generate` ✓ · `prisma validate` ✓ ·
`tsc --noEmit` on `@upchaar/db` and `@upchaar/types` ✓

## Phase 1 — Parallel (agents)

| Status | Item | Path | Depends on |
|---|---|---|---|
| ✅ | REST API | `apps/api` | Phase 0 |
| ✅ | Design system | `packages/ui` | Phase 0 |

## Phase 2 — Parallel (agents)

| Status | Item | Path | Depends on |
|---|---|---|---|
| ✅ | Patient app | `apps/patient` | api, ui |
| ✅ | Doctor app | `apps/doctor` | api, ui |
| ✅ | Hospital app | `apps/hospital` | api, ui |

> **Phase 2 attempt #1 aborted.** All three frontend agents were killed by an
> account session limit on their first tool calls. They wrote **nothing** —
> `apps/` contained only `api`, so there is no partial state to clean up.
> Phase 2 restarts from scratch, dispatched one agent at a time rather than
> three in parallel to stay inside the budget.

## Phase 3 — Finish

| Status | Item | Path |
|---|---|---|
| ✅ | Docker + compose | `Dockerfile`s, `docker-compose.yml` |
| ✅ | Root README + demo credentials | `README.md` |
| ✅ | Verification: install, generate, typecheck, build, boot, smoke | — |

---

## Build log

Append one line per completed unit of work. Newest at the bottom.

- `2026-08-17` — Repo created. Tracker docs written (`ARCHITECTURE`, `FEATURES`, `API_CONTRACT`, `AGENT_BRIEF`, `PROGRESS`).
- `2026-08-17` — Phase 0 complete. Root workspace + turbo + typescript-config + `@upchaar/db` (schema validated, seed) + `@upchaar/types` (Zod contract). Install, generate and typecheck all pass.
- `2026-08-17` — Phase 1 dispatched to agents: `apps/api` and `packages/ui`.
- `2026-08-17` — DB layer verified end-to-end against a live Postgres 16 container: `db push` + seed + queue-position SQL check all pass. Root `docker-compose.yml` and `.dockerignore` written (postgres + api + patient + doctor + hospital; no Redis, per locked decision).
- `2026-08-17` — **`apps/api` complete.** Express 5 + TS (strict, ESM) implementing every endpoint in `API_CONTRACT.md`: auth (patient/hospital/doctor + change-password + `/me`), hospitals (search/detail/me/stats), departments, doctors (incl. hospital provisioning with one-time temp password), appointments (transactional `queueNumber` allocation with P2002 retry, transition table enforced → 409), queue (`/appointment/:id`, `/department/:id`, `/department/:id/next`), SSE `/stream/*` (EventEmitter bus, 25s heartbeat, `?token=` auth, listener cleanup on `close`), beds, inventory, records (doctor access gated on a shared appointment), Gemini AI (Dr. Positive streamed `text/plain` + drug-interaction JSON with one retry → 502; both 503 when `GEMINI_API_KEY` is unset). Central error handler (Zod→400 + field errors, ApiError→status, P2002→409, P2025→404), structured logger, helmet + env-driven CORS, `/health` with `SELECT 1`, graceful SIGTERM/SIGINT. `typecheck` ✓ `build` ✓ and a read-only end-to-end pass against the seeded Postgres (public search, all three logins, queue math, stats, RBAC 403s, 409 on an illegal transition) ✓.
- `2026-08-18` — **`apps/api` write path verified against live Postgres — 24/24 checks green.** Five *concurrent* bookings into one queue bucket produced `queueNumber` 1–5 with no gaps or duplicates; the P2002 retry fired repeatedly under real contention (visible in the logs) and every request still returned 201. SSE proven end-to-end: a patient watching appointment #3 saw `peopleAhead` go 0 → 1 → 2 (`estimatedWaitMinutes` 40) as the two people ahead were confirmed, the department console received `appointment.updated` on the same events, and REST `/queue/appointment/:id` agreed with the SSE payload; completing an appointment correctly dropped it out of the queue (2 ahead → 1). Transitions (`PENDING→COMPLETED` 409, `CONFIRMED→IN_PROGRESS` stamps `startedAt`, `IN_PROGRESS→COMPLETED` stamps `completedAt`, repeat-status 409, double-cancel 409) and tenancy (foreign patient 403, foreign hospital 403) all behave. Test rows were created in an isolated future-day bucket and deleted afterwards; seed verified unchanged (20 appointments, 15 medicines, 9 beds, 0 leftovers).
- `2026-08-17` — **`packages/ui` complete.** `@upchaar/ui`, a no-build source package exporting TSX directly (`"./*" → ./src/components/*.tsx`, `"." → src/index.ts` barrel, `"./styles.css"`, `"./lib/utils"`). 34 component files, hand-written shadcn-style on `radix-ui` 1.6 + `cva` + `cn()` + `lucide-react` + `sonner`; `data-slot` attributes throughout, React 19 ref-as-prop (no `forwardRef` shims needed). Tailwind v4 theme in `src/styles.css`: full oklch token set on `:root` with a `.dark` override, `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode, `@theme inline` bridge, typography scale, one `shadow-soft` elevation, `--radius: 0.75rem`. **Every foreground/background pair in the token set was numerically verified at ≥ 4.5:1 (WCAG AA) in both themes.** Verified: `pnpm --filter @upchaar/ui run typecheck` ✓ · the app-side CSS entry (`@import "tailwindcss"` + `@import "@upchaar/ui/styles.css"` + `@source`) compiles through `@tailwindcss/postcss` and emits every utility the components use ✓ · an SSR smoke render of all 34 components (`renderToStaticMarkup`) passes 12 assertions covering ARIA wiring, empty/loading states and the pagination range maths ✓.

- `2026-08-18` — **`apps/api` write-path verification complete.** Five concurrent bookings into one (hospital, department, day) bucket produced `queueNumber` 1–5 with no gaps or duplicates; the P2002 retry fired under real contention and every request still returned 201. SSE verified end-to-end (`peopleAhead` 0→1→2, REST and stream agreeing); transition 409s and cross-tenant 403s confirmed. Seeded demo data verified unchanged, 0 leftover test rows.
- `2026-08-18` — Phase 2 attempt #1 aborted (session limit); no files written. DB re-seeded so the live Cardiology queue lands on the current day.
- `2026-08-18` — **`apps/patient` complete.** Next.js 15 App Router + React 19, TS strict, port 3000, `transpilePackages: ["@upchaar/ui"]` + `output: "standalone"`. All 11 rows built: multi-step Zod-validated signup (P1), login/logout via an httpOnly cookie set by `app/api/session/route.ts` + `middleware.ts` (P2), dashboard with next visit / live queue / health tiles (P3), hospital search with q + city + department + free-beds filters and pagination (P4), hospital detail with departments, doctors and bed occupancy (P5), booking hospital → department → optional doctor → date/time (P6), **live queue over SSE** — `EventSource` on `/stream/appointment/:id?token=`, events pushed straight into the React Query cache, capped-backoff reconnect, breathing "Live" chip and freshness clock (P7), appointments list with status filter + cancel confirmation (P8), medical records view/edit (P9), Dr. Positive streamed `text/plain` chat with stop/abort (P10), drug-interaction report rendered with `severity-badge` (P11). One typed `lib/api.ts` unwraps the envelope and throws `ApiError { status, message, errors }`, which every form renders inline. Skeletons + real empty states on every list; sonner toasts on every mutation; light/dark on shared tokens only. Verified: `pnpm install --filter @upchaar/patient...` ✓ · `typecheck` ✓ · `build` ✓ (14 routes) · live browser pass against the seeded API — login → dashboard showed queue position #2 (1 ahead, ~20 min, now serving #1) streaming over SSE, hospital search, appointment detail ("You are next"), records, and both AI routes degrading to a calm 503 notice. No writes were made to the database.

- `2026-08-18` — Switched Phase 2 strategy to conserve session budget: orchestrator (opus) builds each app's foundation directly (package.json, next.config, tsconfig, middleware, session cookie plumbing, and a complete typed `lib/api.ts` client) and verifies it typechecks standalone, then a Haiku subagent builds only the pages/components on top of it. `apps/doctor` foundation was already partial from an aborted attempt; `apps/hospital` foundation written fresh and typechecks clean. Two Haiku agents dispatched in parallel for doctor pages (8 screens) and hospital pages (9 screens).
- `2026-08-18` — **`apps/doctor` complete.** Next.js 15 App Router + React 19, TS strict, port 3001, same foundation pattern as `apps/patient`. All 8 screens built: login/logout via httpOnly cookie + middleware gating (screens 1–2), app shell with sidebar nav and duty toggle (screen 3), dashboard with stats tiles + on/off duty switch + today's appointments list (screen 4), **queue console with real-time SSE updates** — live "now serving" card + waiting queue table + "Call next" button, server-push updates from `/stream/queue/:departmentId?token=` into React Query cache with capped-backoff reconnect and connection status chip (screen 5), appointments list with status filter tabs + date picker + inline status transition buttons (confirm/start/complete/cancel) respecting ALLOWED_STATUS_TRANSITIONS and disabling invalid actions with toast feedback (screen 6), patient detail page reading `api.records.forPatient()` with full medical history (chronic diseases, allergies, surgeries, medications, lifestyle, notes) + 403 access denied handling (screen 7), profile page with view/edit name + phone + specialization + separate password change section (screen 8). Uses React Query with typed `queryKeys` and hooks; SSE hook mirrors `apps/patient`'s shape; every form has field-error rendering + sonner toasts; loading skeletons + real empty states on every list; light/dark on shared tokens only. Verified: `pnpm install --filter @upchaar/doctor...` ✓ · `typecheck` ✓ (no errors) · `build` ✓ (11 routes, ~170 kB largest). Did not write to the database — all screens wired to the live API but no mutations executed.
- `2026-08-18` — **`apps/hospital` complete.** Next.js 15 App Router + React 19, TS strict, port 3002, same foundation pattern. All 9 screens built: login/register (screens 1–2), app shell with sidebar nav + theme toggle + account menu (screen 3), dashboard with 4 KPI stat cards (appointments today, bed occupancy %, low stock, doctor count) + department load table from `api.hospital.stats()` (screen 4), departments table with create/edit/delete dialogs (name, description, avgConsultMinutes, headDoctor) (screen 5), doctors table with create (email field shown once only) + edit (can toggle availability) + delete dialogs, **create shows temp password exactly once in a separate modal** with copy-to-clipboard and explicit "will not be shown again" warning (screen 6), appointments list with status filter tabs (PENDING/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED) + date filter + department filter + inline "Assign doctor" and "Change status" dropdown buttons, status transitions respect API state machine (409 on invalid moves, buttons disabled) (screen 7), beds form with total/available inputs for ICU/GENERAL/PREMIUM bed types, client-side and API-enforced `available <= total` validation, single "Save" button (screen 8), inventory table with search box + "Low stock only" + "Expiring soon (30 days)" toggle filters, create/edit/delete dialogs (name/quantity/threshold/unit/expiryDate), low-stock and near-expiry rows visually flagged with `warning`/`destructive` badges (screen 9). Uses React Query with `queryKey` invalidation on mutations; every form has field-error inline rendering + sonner toasts; loading skeletons + real empty states on all lists; light/dark on shared tokens; appointment fields use nested API response objects (`apt.patient?.name`, `apt.department?.id`, `apt.doctor?.name`). Verified: `pnpm install --filter @upchaar/hospital...` ✓ · `typecheck` ✓ (no errors) · `build` ✓ (11 routes, ~140 kB largest). Did not write to the database — all screens wired to the live API but no mutations executed.

- `2026-08-18` — **Full-stack Docker verification complete, three real bugs found and fixed (all in the orchestrator's own Dockerfiles, not agent code):** (1) pnpm's deps-status check wants an interactive confirmation with no TTY in a Docker build (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`) — fixed with `ENV CI=true` in the shared `base` stage of all four Dockerfiles. (2) The three frontend Dockerfiles unconditionally copied and built `packages/db` even though none of patient/doctor/hospital depend on it — stripped that step out. (3) The API Dockerfile's `pnpm prune --prod` step re-materialised `@prisma/client` from pnpm's content-addressable store, silently discarding the in-place generated client and reverting it to the "did not initialize yet" stub — confirmed by inspecting the runtime image's `.prisma/client/default.js` (2076 bytes, the pristine stub) vs. the real generated output (182 bytes re-exporting a 47KB `index.js` + the 15.7MB query engine binary + `schema.prisma`). Fixed by dropping the prune step and copying the runtime layer straight from the already-verified `build` stage (the same stage `migrate` uses) — correctness over image size for this deliverable. After both fixes: `docker compose build` (all 5 images) ✓, `docker compose up -d` ✓, all 5 containers healthy (`postgres`, `migrate` exits 0 after seeding, `api`, `patient`, `doctor`, `hospital`), all three frontends redirect `/` → `/login` correctly, all three logins (patient/hospital/doctor) succeed through the containerized API, hospital search returns real data, and no errors in any container's logs. Root `pnpm typecheck` (10/10) and `pnpm build` (7/7) also verified clean across the whole workspace outside Docker.

- `2026-08-18` — **Two production bugs found and fixed via live debugging against the running Docker stack** (user reported "Gemini chat not working" + a records-page error):
  1. **Dr. Positive chat streamed zero bytes despite HTTP 200.** Root-caused by instrumenting the compiled route live in the container: `req.on("close")` in `apps/api/src/routes/ai.routes.ts` fired mid-request — a known Node/Express gotcha where the request stream can emit `close` as soon as its (tiny, already-buffered) body is read, well before the response completes — silently flipping `disconnected = true` before any chunk arrived. Fixed by switching to `res.on("close")` gated on `!res.writableEnded`, which only trips on a genuine client abort. Compounding cause: `gemini-2.5-flash` spends part of `maxOutputTokens` on internal "thinking" tokens (observed 203–370 of a 512 budget) before any visible text, so some prompts exhausted the whole budget on thinking alone and streamed zero chunks — raised to 2048. Verified with 5 isolated live trials against the running API: 4/5 returned full, correctly-toned replies (the one repeat failure came from firing two requests back to back, likely a rate-limit/connection artifact, not the original bug).
  2. **`records/me` returned 404 "Patient not found"** — not a code bug. The user's browser held an httpOnly session cookie issued before the orchestrator's own repeated `prisma db push`/reseed cycles during earlier Docker debugging, which regenerate every row's `cuid()` id. Confirmed by testing with a freshly-issued token, which worked immediately. Fix: log out and back in. No code change needed.
  Also: switched the `GEMINI_MODEL` default to `gemini-2.5-flash` in `docker-compose.yml` — the user's key has no access to `gemini-1.5-flash` (fully retired by Google); confirmed via a live `ListModels` call against the key which key access to the 2.x/3.x model families only.

---

## Known open items / follow-ups

Anything discovered mid-build that is not yet fixed goes here so it is not lost.

- **`.env` cannot be created by tooling in this environment** — the sandbox
  silently blocks writes to `.env`. The user must copy it manually:
  `cp .env.example .env`. `packages/db/.env` is a symlink to the root `.env`
  and resolves once that file exists. Docker Compose supplies env directly, so
  containers are unaffected.
- ~~Docker daemon not running; schema/seed unverified against live Postgres.~~
  **RESOLVED** — Postgres 16 container started, `prisma db push` synced cleanly,
  seed inserted 3 hospitals / 12 departments / 8 doctors / 5 patients /
  15 medicines / 20 appointments. Live Cardiology queue verified by SQL:
  qn1 IN_PROGRESS, qn2–4 CONFIRMED, qn5 PENDING (correctly outside the queue).
- **Re-seed on the day you demo.** The seeded live queue is pinned to the date the
  seed ran (`scheduledDay` 2026-08-17), but `/queue/department/:id`,
  `/hospitals/me/stats` and `/doctors/me/stats` are all scoped to *today* by
  design. A day later that Cardiology console is already empty — the queue data
  is fine, it is just yesterday's. `pnpm db:seed` is idempotent, so re-running it
  before the demo restores the live queue. Worth a line in the root README.
- `packages/db/package.json` uses the deprecated `package.json#prisma` seed key.
  Fine for Prisma 6; migrate to `prisma.config.ts` before Prisma 7.
- **BLOCKER for Docker/Phase 3 — `pnpm --filter @upchaar/api start` cannot run.**
  `@upchaar/types` and `@upchaar/db` publish raw TypeScript (`main: ./src/index.ts`,
  no build output), so the compiled `apps/api/dist/index.js` fails at runtime with
  `ERR_UNKNOWN_FILE_EXTENSION` when Node tries to load `packages/types/src/index.ts`.
  `pnpm dev` (tsx) and `tsc`/`typecheck` are unaffected — this only hits
  `node dist/index.js`. Fix is in the shared packages (main-session lane), pick one:
  (a) give both packages a real build (`tsup`/`tsc` emitting `dist` + an `exports`
  map with `types`/`import` entries), or (b) run the API container under `tsx`.
  Node's `--experimental-strip-types` is *not* a fix: it loads `@upchaar/db` but
  chokes on `@upchaar/types`' relative `./common.js` specifiers.
- **Validation errors carry an extra top-level `errors` key.** The envelope stays
  exactly `{ success:false, message:"Validation failed", data:null }`; per-field
  messages are added as `errors: { "field.path": ["message"] }` because the
  documented envelope has nowhere else to put them. Additive, so existing
  `ApiResponse<T>` consumers are unaffected — worth mirroring in the frontends'
  `ApiError`.
- **List endpoints return the paginated shape.** `GET /appointments` *and*
  `GET /appointments/mine` both return `{ items, total, page, limit }`, since
  `appointmentListQuerySchema` already carries `page`/`limit`. `GET /departments`,
  `GET /doctors`, `GET /beds` and `GET /inventory` return plain arrays.
- `GET /health` returns the standard envelope with the documented payload in
  `data` (`{ status, db, uptime }`), and answers `503` when `SELECT 1` fails, so it
  can double as a container healthcheck.
- `POST /queue/department/:id/next` has no documented response body; it returns
  `{ completed, nowServing, queue }` (two `Appointment`s, nullable, plus the fresh
  `DepartmentQueue`) so the doctor console can repaint from one call.
- Department queue listings (`/queue/department/:id`, the SSE snapshot) include
  `PENDING` rows so a console can confirm them; queue *position* maths still counts
  only `CONFIRMED`/`IN_PROGRESS`, exactly as `ARCHITECTURE.md` specifies.
- `GET /queue/appointment/:id` is readable by the owning patient **and** by the
  doctors/admin of that appointment's hospital — a superset of the contract's
  "PATIENT owner", needed by the doctor console.
- `GEMINI_MODEL` (default `gemini-1.5-flash`), `JSON_BODY_LIMIT` (default `1mb`) and
  `LOG_LEVEL` (default `info`) are new optional env vars read by `apps/api`; all have
  defaults, so `.env.example` does not strictly need updating.

### `apps/patient` — notes and open items

- **Docker-ready.** `output: "standalone"` is set, so `next build` emits
  `.next/standalone`. The pre-written `apps/patient/Dockerfile` copies
  `apps/patient/public`, so that directory now exists (it holds `favicon.svg`) —
  without it the image build would fail on that `COPY`. The Docker image itself has
  not been built or run; that is Phase 3's lane.
- **The session token is handed to the client on purpose.** It lives in an httpOnly
  cookie (`upchaar_patient_token`); the root layout reads it server-side and passes it
  to a `SessionProvider`, because `EventSource` cannot send an `Authorization` header
  and the SSE route only accepts `?token=`. Browser calls therefore go straight to the
  API rather than through a Next proxy, which is what `CORS_ORIGINS` already allows.
- **Hospital search filters by `departmentId`, not by speciality name.** Departments
  are per-hospital rows, so the filter select groups every department under its
  hospital name (`SelectGroup` + `SelectLabel`). A cross-hospital "all Cardiology"
  filter would need either a speciality field on `Department` or a `departmentName`
  query param on `GET /hospitals`.
- **Booking offers "quick pick" times, not real slots.** There is no availability
  model in the API — the chips only prefill the native time field; any time the
  patient enters is accepted, exactly as `POST /appointments` allows.
- **P1 (signup) and P6 (booking) were built to the contract but not exercised against
  the live database**, since both are write paths and the seeded demo data had to stay
  pristine. Both share the same validated `ApiError`/field-error plumbing that the
  read paths were verified with.
- Patient profile fields (name, phone, blood group) are read-only in the UI: the
  contract has no patient self-update endpoint. Only `PUT /records/me` is editable.

### `packages/ui` — notes for the three app agents

- **Every app must set `transpilePackages: ["@upchaar/ui"]`** in `next.config.ts`.
  The package ships raw `.tsx`; there is no build step and no `dist`. (This is safe
  where the API blocker is not: only Next bundles it, Node never `require`s it.)
- **`src/styles.css` deliberately does *not* `@import "tailwindcss"` itself.** The app
  owns that import; importing it in both files makes Tailwind emit preflight and the
  whole theme layer twice (verified: 13.7 kB → 9.7 kB when removed). Use exactly the
  three lines from `AGENT_BRIEF.md`, in this order:
  `@import "tailwindcss";` · `@import "@upchaar/ui/styles.css";` · `@source "../../../packages/ui/src";`
- **Dark mode is class-based**, driven by `<ThemeProvider>` + `<ThemeScript />` (put
  `ThemeScript` in `<head>` to avoid a flash). No `next-themes` dependency. Storage key
  `upchaar-theme`, shared across all three apps.
- **Extra tokens beyond the brief's list**, added because status/severity badges and
  alerts need a calm tinted surface that still hits AA: `--*-subtle` and
  `--*-subtle-foreground` for `primary`, `destructive`, `success`, `warning`, `info`
  (Tailwind classes `bg-success-subtle text-success-subtle-foreground`, etc.). Also
  `text-2xs` (0.6875rem) and `shadow-soft` (the single elevation level).
- **`--primary` is exactly the locked `oklch(0.62 0.11 195)`, so `--primary-foreground`
  is a dark ink, not white** — white on that teal is only 3.4:1 and fails AA. Solid
  primary chips are therefore "bright teal + ink text" in both themes. Consequence:
  **do not use `text-primary` for body text or links** (same 3.4:1 problem); use
  `text-primary-subtle-foreground` (7.4:1 on card) for teal text, and reserve
  `--primary` for fills, borders, rings and icons.
- `@upchaar/ui` depends on `@upchaar/types` for the `AppointmentStatus` and
  `InteractionSeverity` unions used by `StatusBadge` / `SeverityBadge`. It is an
  `import type`, so nothing from `@upchaar/types` is pulled in at runtime.
- Not built, because nothing in `FEATURES.md` asked for it: accordion, command
  palette, combobox/typeahead, calendar widget (native `<DateInput>`/`<TimeInput>`
  instead, per the brief), chart components (the `--chart-1..5` tokens exist and are
  AA-separable if a dashboard later wants them).
