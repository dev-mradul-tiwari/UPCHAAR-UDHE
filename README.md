# Upchaar

A hospital, doctor and patient platform: patients discover hospitals and book
appointments, doctors run a live consultation queue, and hospital admins manage
departments, staff, beds and medicine inventory.

Built as a Turborepo monorepo — TypeScript end to end, one shared API contract,
one shared design system.

```
apps/
  api/        Express 5 + Prisma + Postgres        :4000
  patient/    Next.js 15                           :3000
  doctor/     Next.js 15                           :3001
  hospital/   Next.js 15                           :3002
packages/
  db/         Prisma schema, client, demo seed
  types/      Zod schemas — the shared API contract
  ui/         shadcn/ui components + Tailwind v4 theme
  typescript-config/
docs/         Architecture, features, API contract, progress tracker
```

---

## Quick start — Docker (everything, one command)

```bash
cp .env.example .env       # then edit JWT_SECRET (and GEMINI_API_KEY if you want AI)
docker compose up -d --build
```

Compose brings up Postgres, runs a one-shot `migrate` service that pushes the
schema and seeds demo data, then starts the API and all three frontends.

| App | URL |
|---|---|
| Patient | http://localhost:3000 |
| Doctor | http://localhost:3001 |
| Hospital admin | http://localhost:3002 |
| API | http://localhost:4000/api/v1 |
| Health | http://localhost:4000/health |

```bash
docker compose logs -f     # follow
docker compose down        # stop
docker compose down -v     # stop and wipe the database
```

## Quick start — local development

Requires Node >= 20, pnpm 11, and a Postgres you can reach.

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres      # or point DATABASE_URL at your own
pnpm db:push
pnpm db:seed
pnpm dev                           # all four apps via Turborepo
```

Run one app on its own with `pnpm --filter @upchaar/patient dev`.

---

## Demo credentials

All seeded accounts:

| Role | Email | Password |
|---|---|---|
| Patient | `mradul@example.com` | `Password123!` |
| Hospital admin | `admin@apollocity.in` | `Password123!` |
| Doctor | `aarti.deshmukh@apollocity.in` | `Doctor123!` |

Other seeded patients (`sneha@`, `rajesh@`, `fatima@`, `arjun@` `@example.com`)
share the patient password. Other hospitals: `admin@sunrisemed.in`,
`admin@greenfieldcare.in`.

### Demoing the live queue

The headline feature is the real-time queue. Apollo City Hospital → Cardiology
is seeded with one patient in progress and three waiting.

1. Sign in to the **doctor** app as Dr. Aarti Deshmukh → queue console.
2. Sign in to the **patient** app as Mradul Tiwari (queue position #2) in
   another window → his live queue screen.
3. Hit **Call next** in the doctor app. The patient's position updates
   immediately over SSE — no refresh.

> **Re-seed on the day you demo.** The queue is scoped to *today*, and the seed
> pins appointments to the date it was run. If the console looks empty, the data
> is simply yesterday's — run `pnpm db:seed` again. The seed is idempotent.

---

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | every app in watch mode |
| `pnpm build` | build everything |
| `pnpm typecheck` | `tsc --noEmit` across the monorepo |
| `pnpm db:push` | sync the Prisma schema |
| `pnpm db:seed` | reset and reload demo data |
| `pnpm db:studio` | Prisma Studio |
| `pnpm docker:up` / `docker:down` | full stack in containers |

## Environment

See `.env.example`. The essentials:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | **change this** — long random string |
| `GEMINI_API_KEY` | optional; without it the two `/ai` routes answer `503` and everything else works normally |
| `NEXT_PUBLIC_API_URL` | API base URL used by the browser |
| `API_URL` | API base URL used server-side (docker-internal) |

## Architecture notes

- **One contract, no drift.** Every request and response shape is a Zod schema in
  `packages/types`. The API validates with them; the frontends import them. The
  two sides cannot disagree.
- **The queue has no Redis.** Position is derived, not stored: `queueNumber` is
  allocated inside a transaction (unique per hospital + department + day), and
  position is a count of lower-numbered `CONFIRMED`/`IN_PROGRESS` rows.
  Cancellations and completions advance the queue with no mutation at all.
- **Realtime is SSE**, not WebSockets — no extra service, and it survives a
  container restart by reconnecting.
- **Doctors are provisioned, not self-registered.** A hospital creates the
  account and receives a temporary password once; the doctor is forced to change
  it on first login.

Deeper detail lives in [`docs/`](./docs) — `ARCHITECTURE.md` (decisions),
`API_CONTRACT.md` (every endpoint), `FEATURES.md` (scope), `PROGRESS.md`
(build log and open items).
