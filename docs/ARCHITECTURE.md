# Upchaar — Architecture & Locked Decisions

> This file is the source of truth for stack decisions. Do not deviate without
> updating this file first.

## Repo layout

```
mradul-upchar/
├── apps/
│   ├── api/          Express 5 + TypeScript REST API
│   ├── patient/      Next.js 15 — patient-facing
│   ├── doctor/       Next.js 15 — doctor-facing
│   └── hospital/     Next.js 15 — hospital admin
├── packages/
│   ├── db/           Prisma schema, client singleton, seed
│   ├── types/        Zod schemas + inferred TS types (API contract)
│   ├── ui/           Shared shadcn/ui components + Tailwind theme
│   ├── eslint-config/
│   └── typescript-config/
└── docs/             Trackers (this folder)
```

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | `pnpm@11`, Node >= 20 |
| Language | TypeScript everywhere | `strict: true`, no `any` in app code |
| API | Express 5 | native async error forwarding |
| ORM | Prisma 6 | Postgres 16 |
| Validation | Zod | shared via `@upchaar/types` |
| Auth | JWT, role-scoped | `PATIENT` / `DOCTOR` / `HOSPITAL` |
| Passwords | bcryptjs | pure JS — avoids native build in Docker |
| Frontend | Next.js 15 App Router, React 19 | |
| Styling | Tailwind v4 + shadcn/ui | shared via `@upchaar/ui` |
| Data fetching | TanStack Query v5 | |
| Realtime | **SSE** (`/api/v1/stream/*`) | no WebSocket service |
| AI | Google Gemini (`@google/generative-ai`) | chatbot + drug interaction |
| Container | Docker multi-stage + compose | postgres + 4 app services |

## Locked decisions (confirmed with the user)

1. **Depth: demo-solid.** Everything works end-to-end against real Postgres with
   seeded data. Clean, typed, dockerized. *No* test suite, rate limiting, audit
   logs, or refresh-token rotation.
2. **Queue lives in Postgres, not Redis.** There is **no Redis service**.
   Queue position is derived from `Appointment.queueNumber` (see below).
3. **Realtime via SSE.** The API exposes an event stream; clients subscribe.
   No polling loops, no Socket.IO.
4. **Doctors are provisioned by hospitals.** No doctor self-signup. Hospital
   admin creates the doctor; a temp password is returned once and the doctor is
   forced to change it on first login (`mustChangePassword`).
5. **Gemini AI chatbot is in scope** ("Dr. Positive" patient counselor), plus a
   drug-interaction checker.
6. **No marketing/landing page.** Each app redirects `/` to its login or
   dashboard.
7. **Greenfield.** Nothing is imported from the old repos. `sih-upchaar-project`
   and `upchaar` are reference-only and must never be modified.

## Queue design (Postgres, replaces Redis sorted sets)

`Appointment.queueNumber` is an integer assigned at booking time, monotonic per
`(hospitalId, departmentId, calendar day)`. It is allocated inside a transaction:

```
queueNumber = (max queueNumber for that hospital+dept+day) + 1
```

Live position for an appointment is then computed as:

```
peopleAhead = count(appointments where
    same hospital + department + day
    and status in (CONFIRMED, IN_PROGRESS)
    and queueNumber < mine)
position   = peopleAhead + 1
```

`CANCELLED` and `COMPLETED` appointments drop out automatically, so the queue
advances without any mutation. Estimated wait = `peopleAhead * avgConsultMinutes`
(department-level constant, default 15).

## Auth model

- One `POST /auth/login` per role namespace; the JWT payload is
  `{ sub, role, hospitalId? }`.
- `requireAuth(role)` middleware attaches `req.auth`.
- Tokens are stored client-side in an httpOnly cookie set by a Next.js route
  handler, so server components can read the session.
- Token TTL 7d. No refresh rotation (demo-solid).

## Conventions

- **Response envelope** — every endpoint returns
  `{ success: boolean, message: string, data: T | null }`.
  Errors use the same shape with `data: null` and a non-2xx status.
- Prisma IDs are `cuid()` strings, never autoincrement ints.
- All money/count fields are integers; no floats except `Hospital.rating`.
- Timestamps are ISO-8601 UTC strings over the wire.
- Never `console.log` in `apps/api` — use the `logger` util.
