# Upchaar-UDHE (Unified Digital Healthcare Ecosystem)

**Upchaar-UDHE (Unified Digital Healthcare Ecosystem): An AI-Enabled Real-Time Platform for Intelligent Healthcare Coordination, Resource Availability, and Inter-Hospital Connectivity**

Upchaar-UDHE connects patients, doctors, and hospital administrators in a unified, real-time healthcare ecosystem. Patients discover hospitals, book time-slotted appointments, and monitor their live queue position; doctors run a real-time consultation console; and hospital admins manage departments, doctor rosters, bed allocations, inter-hospital referrals, and medicine inventory.

---

## 🚀 Key Features & Capabilities

### 🌐 1. Bilingual System (English + Hindi 🌐 EN | हिंदी)
- **1-Click Language Switcher**: Seamless `🌐 EN | हिंदी` toggle in the top header navbar across all 3 portals.
- **Native Devanagari Translations**: Complete UI translations for navigation items, queue metrics (*"आपसे आगे मरीज"*, *"अनुमानित प्रतीक्षा"*, *"आपकी बारी है"*), dashboard greetings, and status badges.
- **Persistent Preference**: Remembers the user's language selection in `localStorage`.

### 📲 2. Automated Multi-Provider SMS Engine
- **Dual-Provider Architecture**: Supports **Jio SIM Android Gateway** (`SMS_PROVIDER=jio`) and **Twilio** (`SMS_PROVIDER=twilio`) with zero-downtime automatic failover (`SMS_PROVIDER=auto`) and offline developer console logging (`SMS_PROVIDER=console`).
- **Smart Queue & Slot SMS Triggers**:
  - **Booking Request**: Includes booked time slot & date (*"Hi Rajesh, your appointment request at Apollo City Hospital (Orthopaedics) for Sun, 23 Aug 2026 at 5:00 PM is received. Token #2"*).
  - **Custom Token #2 Confirmation**: Special confirmation text when 1 person is ahead (*"CONFIRMED. Token #2. Only 1 patient is ahead of you, so we hope you will come on time."*).
  - **1-Person-Ahead Urgent Alert**: Notifies waiting patients (*"ALERT: There is only 1 patient ahead of you... Please come near the consultation room as soon as possible"*).
  - **Consultation Complete & Feedback**: Clean doctor name formatting (*"with Dr. Rohan Mehta"*) inviting patient ratings.
- **Dynamic Mobile Redirection**: Patients can update their phone number on `/records`, instantly redirecting all future SMS alerts to the newly updated number.

### ⏱️ 3. Real-Time Live Queue (SSE Driven)
- **Server-Sent Events (SSE)**: Live queue position updates without manual page refreshes.
- **Zero-Redis Queue Engine**: Position is derived dynamically via PostgreSQL transactions to prevent collisions.
- **Calculated Wait Times**: Live estimated wait times based on average consultation durations and slot windows.

### ⭐️ 4. Mandatory Rating & Feedback System
- **Doctor Rating Badge**: Displays average star ratings directly beside doctor names on hospital dashboards.
- **Rating Enforcer**: Prompts patients to rate their previous consultation before booking a new appointment.

### 🤖 5. AI-Enabled Care Modules (Gemini AI)
- **Dr. Positive**: Intelligent AI health assistant providing calm, guided answers.
- **Medicine Interaction Checker**: Evaluates potential drug-drug interactions before prescription/use.

### 🏥 6. Hospital Admin & Inter-Hospital Referrals
- **Doctor Provisioning**: Auto-generates secure temporary passwords for new doctors with mandatory first-login password updates.
- **Inter-Hospital Referrals**: Track incoming and outgoing patient transfers between hospitals.
- **Bed & Resource Management**: Live bed capacity tracking (ICU, Ventilator, General ward) and inventory stock control.

---

## 🏗️ Monorepo Structure

Built as a high-performance Turborepo monorepo with 100% type safety and a unified design system:

```
apps/
  api/            Express 5 + Prisma 6 + PostgreSQL          :4000
  landing/        Next.js 16 (Landing Page / Portal Hub)     :3004
  patient/        Next.js 15 (Patient Portal)                :3000
  doctor/         Next.js 15 (Doctor Console)                :3001
  hospital/       Next.js 15 (Hospital Admin Dashboard)      :3002
  health-worker/  Next.js 15 (ASHA Health Worker Portal)     :3003
packages/
  db/         Prisma schema, client, demo seed
  types/      Zod schemas — shared API contract
  ui/         Shadcn UI + Tailwind CSS v4 + i18n components
  typescript-config/
docs/         Architecture, API contract, progress tracker
```

---

## 🐳 Quick Start — Docker (Full Stack)

```bash
cp .env.example .env       # Edit JWT_SECRET and SMS_PROVIDER settings
docker compose up -d --build
```

Compose brings up PostgreSQL, runs schema migrations and seed data, then starts the API and all frontends.

| Service | Local URL |
|---|---|
| **Landing Page (Portal Hub)** | http://localhost:3004 |
| **Patient Portal** | http://localhost:3000 |
| **Doctor Console** | http://localhost:3001 |
| **Hospital Admin Dashboard** | http://localhost:3002 |
| **Health Worker Portal (ASHA)** | http://localhost:3003 |
| **API Endpoint** | http://localhost:4000/api/v1 |
| **Health Check** | http://localhost:4000/health |

---

## 💻 Quick Start — Local Development

### Requirements:
- Node.js >= 20
- pnpm >= 9
- PostgreSQL instance

```bash
cp .env.example .env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

---

## 🔑 Demo Credentials

| Role | Email / Phone | Password |
|---|---|---|
| **Patient** | `mradul@example.com` | `Password123!` |
| **Hospital Admin** | `admin@apollocity.in` | `Password123!` |
| **Doctor** | `aarti.deshmukh@apollocity.in` | `Doctor123!` |
| **Health Worker (ASHA)** | Phone: `9876543210` | `Worker123!` |

*(Other seeded patients: `sneha@example.com`, `rajesh@example.com`, `fatima@example.com` with password `Password123!`).*

---

## ⚙️ Environment Configuration

See `.env.example` for details:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `SMS_PROVIDER` | Options: `console` (terminal logs), `jio` (SIM Gateway), `twilio` (Twilio API), `auto` (Failover) |
| `JIO_GATEWAY_URL` | Endpoint for Jio SIM Android Gateway |
| `JIO_GATEWAY_TOKEN` | Auth token for Jio SIM Gateway |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio Virtual Number / Header |
| `GEMINI_API_KEY` | Gemini AI API key for Dr. Positive & Medicine Check |

---

## 🛠️ CLI Commands

| Command | Action |
|---|---|
| `pnpm dev` | Run all applications in dev watch mode |
| `pnpm build` | Build all packages and apps for production |
| `pnpm typecheck` | Run `tsc --noEmit` across all 8 monorepo packages |
| `pnpm db:push` | Sync Prisma schema to PostgreSQL database |
| `pnpm db:seed` | Reset and populate demo seed data |
| `pnpm db:studio` | Open Prisma Studio GUI |
