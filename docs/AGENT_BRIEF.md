# Agent Brief — read this before writing any code

You are building part of **Upchaar**, a hospital/doctor/patient platform, inside
a Turborepo monorepo at `/Users/mayank/Documents/Web-Dev/mradul-upchar`.

## Read first, in this order

1. `docs/ARCHITECTURE.md` — stack + locked decisions
2. `docs/FEATURES.md` — what to build
3. `docs/API_CONTRACT.md` — exact endpoint shapes
4. `docs/PROGRESS.md` — what already exists

## Hard rules

1. **Stay in your lane.** Only create/modify files under the path you were
   assigned. Never edit another agent's app, and never edit `packages/db` or
   `packages/types` — they are owned by the main session. If you need a change
   there, add it to *Known open items* in `docs/PROGRESS.md` and code against the
   contract as documented.
2. **Never touch** `/Users/mayank/Documents/Web-Dev/upchaar` or
   `/Users/mayank/Documents/Web-Dev/sih-upchaar-project`. Reference-only, and you
   should not need them.
3. **The contract is law.** Field names, response envelope, and status codes come
   from `API_CONTRACT.md`. Do not invent or rename fields. Import types from
   `@upchaar/types` rather than redeclaring them.
4. **TypeScript strict.** No `any`, no `@ts-ignore`, no non-null `!` to silence
   errors. Your work must pass `tsc --noEmit`.
5. **No placeholders.** No `TODO`, no stub components, no mock data left in app
   code. Every screen you list as done must actually render and work.
6. **Do not run `pnpm install`** at the repo root or start dev servers — the main
   session owns install and verification. Write files only. Declare the deps you
   need in your app's `package.json`.
7. When you finish, **update `docs/PROGRESS.md`**: flip your rows to ✅, append a
   build-log line, and record anything unresolved under *Known open items*.

## Workspace package names

`@upchaar/db` · `@upchaar/types` · `@upchaar/ui` · `@upchaar/typescript-config`

Depend on them with `"@upchaar/ui": "workspace:*"`.

## Frontend conventions (apps/patient, apps/doctor, apps/hospital)

- Next.js 15 App Router, React 19, TypeScript.
- Import UI from `@upchaar/ui` — **do not** re-run `shadcn init` or copy
  components locally. If a primitive is missing, note it in PROGRESS and
  compose from what exists.
- Tailwind v4. Consume the shared theme:
  ```css
  @import "tailwindcss";
  @import "@upchaar/ui/styles.css";
  @source "../../../packages/ui/src";
  ```
- Server state via TanStack Query v5. A single typed `apiClient` in
  `lib/api.ts` that attaches the bearer token and unwraps the
  `{ success, message, data }` envelope, throwing `ApiError` on failure.
- Auth token in an httpOnly cookie set by a Next.js route handler
  (`app/api/session/route.ts`); middleware redirects unauthenticated users
  to `/login`.
- `/` redirects to `/dashboard` (authed) or `/login`. No marketing page.
- Ports — patient `3000`, doctor `3001`, hospital `3002`, api `4000`.
- Env: `NEXT_PUBLIC_API_URL` (browser) and `API_URL` (server, docker-internal).

## Design language (all three apps must look like one product)

`packages/ui` is **built and verified** — 34 components, every one importable as
`@upchaar/ui/<name>` (or from the `@upchaar/ui` barrel). Do not rebuild any of
them:

`button` `input` `label` `textarea` `select` `checkbox` `switch` `radio-group`
`card` `badge` `avatar` `separator` `skeleton` `alert` `table` `tabs` `dialog`
`sheet` `dropdown-menu` `popover` `tooltip` `sonner` `progress` `date-input`
`form-field` `pagination` `empty-state` `stat-card` `page-header` `status-badge`
`severity-badge` `queue-position` `data-table` `theme-provider` `theme-toggle`

Helpers: `@upchaar/ui/lib/utils` → `cn`, `clamp`, `initials`.

### Required wiring

- `next.config` **must** set `transpilePackages: ["@upchaar/ui"]`.
- CSS entry — exactly these three lines, in this order:
  ```css
  @import "tailwindcss";
  @import "@upchaar/ui/styles.css";
  @source "../../../packages/ui/src";
  ```
  `styles.css` deliberately does **not** import tailwind itself; importing it in
  both places duplicates preflight.

### Tokens (use only these — never a raw hex)

`background` `foreground` · `card(-foreground)` · `popover(-foreground)` ·
`primary(-foreground)` · `secondary(-foreground)` · `muted(-foreground)` ·
`accent(-foreground)` · `destructive(-foreground)` · `success(-foreground)` ·
`warning(-foreground)` · `info(-foreground)` · `border` `input` `ring` ·
`chart-1`…`chart-5`

Tinted surface pairs for badges/alerts: `primary-subtle(-foreground)` and the
same for `destructive` / `success` / `warning` / `info`.

Non-color: `--radius: 0.75rem`, `shadow-soft` (the only elevation), `text-2xs`,
`animate-fade-in`, `animate-shimmer`.

### One accessibility rule you must follow

**Never use `text-primary` for body copy or links** — the locked teal is 3.4:1 on
card and fails AA. Use `text-primary-subtle-foreground` (7.4:1). Solid primary
surfaces (`bg-primary`) pair with `text-primary-foreground`, which is dark ink,
not white — that is intentional and verified.

- Light **and** dark mode via the shared tokens. Never hardcode hex in components.
- Generous whitespace, `rounded-xl` cards, one soft shadow level, `border` for
  separation rather than heavy dividers.
- Data density increases with role: patient = spacious and reassuring;
  doctor = focused and fast; hospital = dashboard-dense.
- Every list has a real empty state and a skeleton loading state.
- Accessible: labelled inputs, visible focus rings, AA contrast, keyboard-navigable.

## Definition of done

- Every feature row assigned to you renders and works against the real API.
- `tsc --noEmit` clean.
- No unused deps; no dead files.
- `docs/PROGRESS.md` updated.
