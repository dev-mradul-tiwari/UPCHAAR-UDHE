# Upchaar — API Contract

**This is the anti-drift document.** The old project died because controllers and
schema disagreed on field names. Every request/response body below has a matching
Zod schema in `packages/types`. Frontends import those types; the API validates
with them. Neither side hand-writes shapes.

Base URL: `${API_URL}/api/v1` — default `http://localhost:4000/api/v1`

## Envelope

Every response, success or failure:

```jsonc
{ "success": true,  "message": "Appointment booked", "data": { /* ... */ } }
{ "success": false, "message": "Email already registered", "data": null }
```

Status codes: `200` ok · `201` created · `400` validation · `401` unauthenticated
· `403` wrong role / not yours · `404` missing · `409` conflict · `500` server.

Auth header: `Authorization: Bearer <jwt>`.

---

## Auth — `/auth`

| Method | Path | Auth | Body | Data |
|---|---|---|---|---|
| POST | `/auth/patient/register` | — | `PatientRegisterInput` | `{ token, patient }` |
| POST | `/auth/patient/login` | — | `LoginInput` | `{ token, patient }` |
| POST | `/auth/hospital/register` | — | `HospitalRegisterInput` | `{ token, hospital }` |
| POST | `/auth/hospital/login` | — | `LoginInput` | `{ token, hospital }` |
| POST | `/auth/doctor/login` | — | `LoginInput` | `{ token, doctor }` |
| POST | `/auth/doctor/change-password` | DOCTOR | `{ currentPassword, newPassword }` | `{ doctor }` |
| GET  | `/auth/me` | any | — | `{ role, profile }` |

`LoginInput = { email: string.email, password: string.min(8) }`

---

## Hospitals — `/hospitals`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/hospitals` | — | Query: `q?`, `city?`, `departmentId?`, `hasBeds?`(bool), `page?`, `limit?`. Returns `{ items: HospitalSummary[], total, page, limit }` |
| GET | `/hospitals/:id` | — | `HospitalDetail` — includes departments, doctors, beds |
| GET | `/hospitals/me` | HOSPITAL | own profile |
| PATCH | `/hospitals/me` | HOSPITAL | `HospitalUpdateInput` |
| GET | `/hospitals/me/stats` | HOSPITAL | `{ appointmentsToday, bedOccupancyPct, lowStockCount, departmentLoad[] }` |

## Departments — `/departments`

| Method | Path | Auth |
|---|---|---|
| GET | `/departments?hospitalId=` | — |
| POST | `/departments` | HOSPITAL |
| PATCH | `/departments/:id` | HOSPITAL |
| DELETE | `/departments/:id` | HOSPITAL |

`DepartmentInput = { name, description?, headDoctorId?, avgConsultMinutes? }`

## Doctors — `/doctors`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/doctors?hospitalId=&departmentId=` | — | public list for booking |
| POST | `/doctors` | HOSPITAL | provisions account → `{ doctor, tempPassword }` **returned once** |
| PATCH | `/doctors/:id` | HOSPITAL | |
| DELETE | `/doctors/:id` | HOSPITAL | |
| GET | `/doctors/me` | DOCTOR | |
| PATCH | `/doctors/me` | DOCTOR | `{ name?, phone?, specialization? }` |
| PATCH | `/doctors/me/availability` | DOCTOR | `{ isAvailable: boolean }` |
| GET | `/doctors/me/stats` | DOCTOR | `{ todayTotal, seenToday, avgConsultMinutes, onDuty }` |

## Appointments — `/appointments`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/appointments` | PATIENT | `BookAppointmentInput` → assigns `queueNumber` |
| GET | `/appointments/mine` | PATIENT | `?status=` |
| GET | `/appointments` | HOSPITAL \| DOCTOR | scoped to caller. `?status=&date=&departmentId=` |
| GET | `/appointments/:id` | any owner | |
| PATCH | `/appointments/:id/status` | HOSPITAL \| DOCTOR | `{ status }` |
| PATCH | `/appointments/:id/assign` | HOSPITAL | `{ doctorId }` |
| DELETE | `/appointments/:id` | PATIENT | cancels own PENDING/CONFIRMED |

```
BookAppointmentInput = {
  hospitalId: string, departmentId: string, doctorId?: string,
  reason: string.min(3), scheduledFor: string.datetime()
}
AppointmentStatus = PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED
```

Legal transitions — `PENDING→CONFIRMED|CANCELLED`,
`CONFIRMED→IN_PROGRESS|CANCELLED`, `IN_PROGRESS→COMPLETED`. Anything else `409`.

## Queue — `/queue`

| Method | Path | Auth | Data |
|---|---|---|---|
| GET | `/queue/appointment/:id` | PATIENT owner | `QueueStatus` |
| GET | `/queue/department/:departmentId` | DOCTOR \| HOSPITAL | `{ entries: QueueEntry[], nowServing }` |
| POST | `/queue/department/:departmentId/next` | DOCTOR | completes current, promotes next → `IN_PROGRESS` |

```
QueueStatus = {
  appointmentId, status, queueNumber,
  position: number|null, peopleAhead: number|null,
  estimatedWaitMinutes: number|null, nowServing: number|null
}
```

## Realtime — `/stream` (SSE)

`GET /stream/queue/:departmentId` · `GET /stream/appointment/:id`

`Content-Type: text/event-stream`, heartbeat comment every 25s.
Events: `queue.updated` (payload `QueueStatus` or `QueueEntry[]`),
`appointment.updated`. Token passed as `?token=` (EventSource can't set headers).

## Beds — `/beds`

| Method | Path | Auth |
|---|---|---|
| GET | `/beds?hospitalId=` | — |
| PUT | `/beds` | HOSPITAL | upsert all three types at once |

`BedInput = { beds: { type: 'ICU'|'GENERAL'|'PREMIUM', total: int>=0, available: int>=0 }[] }`
— `available <= total` enforced.

## Inventory — `/inventory`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/inventory` | HOSPITAL | `?lowStock=true&expiringInDays=30` |
| POST | `/inventory` | HOSPITAL | |
| PATCH | `/inventory/:id` | HOSPITAL | |
| DELETE | `/inventory/:id` | HOSPITAL | |

`MedicineInput = { name, quantity: int>=0, threshold: int>=0, unit, expiryDate: datetime }`

## Medical records — `/records`

| Method | Path | Auth |
|---|---|---|
| GET | `/records/me` | PATIENT |
| PUT | `/records/me` | PATIENT |
| GET | `/records/patient/:patientId` | DOCTOR — only if they share an appointment, else `403` |

## AI — `/ai`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/ai/chat` | PATIENT | `{ messages: {role,content}[] }` → streamed `text/plain` (Dr. Positive) |
| POST | `/ai/drug-interaction` | PATIENT \| DOCTOR | `{ medicines: string[].min(2) }` → `DrugInteractionReport` |

```
DrugInteractionReport = {
  severity: 'NONE'|'MINOR'|'MODERATE'|'SEVERE',
  summary: string,
  pairs: { a, b, severity, description }[],
  advice: string[], disclaimer: string
}
```

If `GEMINI_API_KEY` is unset the AI routes must return a graceful `503` with
`success:false` — never crash the server at boot.

## Health

`GET /health` → envelope with `data: { status, db, uptime }`. Answers `503` when
`SELECT 1` fails, so it doubles as a container healthcheck.

---

# Implementation notes (as-built)

`apps/api` is **complete and verified**. These clarify the tables above — where
they differ, *these* win, because they describe running code.

### Validation errors carry an extra `errors` key

The envelope is unchanged; per-field messages are added alongside it:

```jsonc
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": { "email": ["Enter a valid email"], "medicalHistory.notes": ["Too long"] }
}
```

Frontend `ApiError` should surface `errors` so forms can show messages inline.

### Which endpoints paginate

| Shape | Endpoints |
|---|---|
| `{ items, total, page, limit }` | `GET /hospitals`, `GET /appointments`, **`GET /appointments/mine`** |
| plain array | `GET /departments`, `GET /doctors`, `GET /beds`, `GET /inventory` |

### Queue specifics

- `POST /queue/department/:id/next` → `{ completed, nowServing, queue }` —
  two nullable `Appointment`s plus a fresh `DepartmentQueue`, so the doctor
  console repaints from a single call.
- Department queue listings (and the SSE snapshot) **include `PENDING` rows** so a
  console can confirm them. Position maths still counts only
  `CONFIRMED`/`IN_PROGRESS`.
- `GET /queue/appointment/:id` is readable by the owning patient **and** by the
  doctors/admin of that appointment's hospital.

### Extra optional env vars

`GEMINI_MODEL` (default `gemini-1.5-flash`) · `JSON_BODY_LIMIT` (default `1mb`) ·
`LOG_LEVEL` (default `info`). All have defaults.
