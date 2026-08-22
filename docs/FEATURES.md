# Upchaar — Feature Specification

Scope confirmed with the user. Anything not listed here is **out of scope**.

---

## apps/patient

| # | Feature | Detail |
|---|---|---|
| P1 | Signup | Multi-step: personal info → medical history. Zod-validated per step. |
| P2 | Login / logout | Email + password. |
| P3 | Dashboard | Next appointment card, live queue position, health summary tiles. |
| P4 | Hospital search | Search by name/city; filter by department + bed availability; sort by rating. |
| P5 | Hospital detail | Departments, doctors, live ICU/General/Premium bed counts. |
| P6 | Book appointment | Hospital → department → doctor (optional) → date/time slot. |
| P7 | **Live queue status** | SSE-driven: position, people ahead, estimated wait. Headline feature. |
| P8 | My appointments | List + filter by status, cancel a PENDING/CONFIRMED booking. |
| P9 | Medical records | View/edit chronic diseases, allergies, surgeries, medications, lifestyle. |
| P10 | Dr. Positive chat | Gemini-backed pre/post-op counselor. Streamed reply. |
| P11 | Drug interaction check | Enter 2+ medicines, get an AI-assessed interaction report. |

## apps/doctor

Accounts are **provisioned by a hospital**; there is no signup screen.

| # | Feature | Detail |
|---|---|---|
| D1 | Login | Email + temp password. |
| D2 | Forced password change | If `mustChangePassword`, gate the whole app until changed. |
| D3 | Dashboard | Today's schedule, patients seen today, avg consult time, on/off duty. |
| D4 | **Queue console** | Current patient, "Call next", "Mark complete". Drives P7 over SSE. |
| D5 | Appointments | List/filter by status and date; confirm or cancel. |
| D6 | Patient detail | Medical history for a patient the doctor is treating. Access-scoped. |
| D7 | Availability toggle | Off-duty removes the doctor from bookable slots. |
| D8 | Profile | Name, phone, specialization; change password. |

## apps/hospital

| # | Feature | Detail |
|---|---|---|
| H1 | Register | Hospital onboarding: details, address, registration number. |
| H2 | Login / logout | |
| H3 | Dashboard | KPIs: appointments today, bed occupancy %, low-stock medicines, per-department load. |
| H4 | Departments | CRUD; assign a head doctor. |
| H5 | **Doctors** | CRUD. Creating a doctor provisions a login and returns a temp password **once**. |
| H6 | Appointments | All hospital appointments; confirm / cancel / complete; assign a doctor. |
| H7 | Bed management | ICU / General / Premium totals and availability. |
| H8 | Inventory | Medicines CRUD, low-stock threshold alerts, expiry warnings. |

---

## Explicitly OUT of scope

Payments · video consultations · insurance claims · e-prescriptions ·
SMS/email notifications · multi-hospital superadmin · file uploads / OCR ·
marketing pages · i18n · test suites.

## Demo seed data

`packages/db` seeds:
- 3 hospitals (different cities), each with 4 departments and bed inventory
- 8 doctors spread across those departments
- 5 patients with populated medical history
- ~20 appointments across all statuses, including a live queue in one department
- ~15 medicine inventory rows, some deliberately below threshold / near expiry

Documented demo credentials go in the root `README.md`.
