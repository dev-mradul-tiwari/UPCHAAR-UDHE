import { ApiError } from "./api-error.js";

/**
 * Calendar day (UTC midnight) used to bucket the queue.
 * Mirrors `Appointment.scheduledDay` in the Prisma schema.
 */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function todayUtc(): Date {
  return startOfUtcDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export function toIso(date: Date): string {
  return date.toISOString();
}

export function toIsoOrNull(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

/** Parse a `?date=` filter (ISO date or datetime) into a UTC calendar day. */
export function parseDayParam(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw ApiError.badRequest("Invalid date filter — use an ISO date such as 2026-08-17");
  }
  return startOfUtcDay(parsed);
}
