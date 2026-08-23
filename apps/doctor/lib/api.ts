/**
 * The single typed gateway to `apps/api`.
 *
 * Everything here speaks the envelope documented in `docs/API_CONTRACT.md`:
 * `{ success, message, data }`, plus the extra `errors` field-map that
 * validation failures (400) carry. Callers get the unwrapped `data` or an
 * `ApiError`.
 */
import type {
  Appointment,
  AppointmentStatus,
  ChangePasswordInput,
  CreateReferralInput,
  Department,
  DepartmentQueue,
  Doctor,
  DoctorSelfUpdateInput,
  DoctorStats,
  LoginInput,
  Paginated,
  PatientRecord,
  Referral,
  Role,
} from "@upchaar/types";

const DEFAULT_API_URL = "http://localhost:4000/api/v1";

/**
 * The browser always talks to the public URL; server-side code prefers
 * `API_URL`, which is the docker-internal address inside a container.
 */
export const API_BASE_URL = (
  (typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)
    : process.env.NEXT_PUBLIC_API_URL) ?? DEFAULT_API_URL
).replace(/\/+$/, "");

/** Browser-only base URL — used by `EventSource`, which runs in the page. */
export const BROWSER_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, "");

/* ----------------------------------------------------------------- errors */

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  /** HTTP status, or `0` when the request never reached the server. */
  readonly status: number;
  /** Per-field messages from a 400, keyed by the field path. */
  readonly errors: FieldErrors | null;

  constructor(status: number, message: string, errors: FieldErrors | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** First message for a field path, e.g. `"newPassword"`. */
  fieldError(path: string): string | undefined {
    return this.errors?.[path]?.[0];
  }

  get isOffline(): boolean {
    return this.status === 0;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** Records the doctor is not treating answer 403. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** An illegal status transition answers 409. */
  get isConflict(): boolean {
    return this.status === 409;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Human-readable message for anything thrown by a mutation. */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message.length > 0) return error.message;
  return fallback;
}

/** Field errors from a thrown value, or an empty map. */
export function fieldErrorsOf(error: unknown): FieldErrors {
  return isApiError(error) && error.errors !== null ? error.errors : {};
}

/* ---------------------------------------------------------------- internals */

type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
  /** Explicit bearer token — server components pass the cookie value here. */
  token?: string | null;
  /** Send no `Authorization` header at all. */
  anonymous?: boolean;
};

let accessToken: string | null = null;

/** Seeded once, in the browser, from the httpOnly session cookie. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFieldErrors(value: unknown): FieldErrors | null {
  if (!isRecord(value)) return null;
  const collected: FieldErrors = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!Array.isArray(raw)) continue;
    const messages = raw.filter((item): item is string => typeof item === "string");
    if (messages.length > 0) collected[key] = messages;
  }
  return Object.keys(collected).length > 0 ? collected : null;
}

function readMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload["message"] === "string") {
    const message = payload["message"].trim();
    if (message.length > 0) return message;
  }
  return fallback;
}

function statusFallback(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have access to this.";
  if (status === 404) return "We could not find that.";
  if (status === 409) return "That action conflicts with the current state.";
  if (status === 503) return "This service is temporarily unavailable.";
  return "Something went wrong. Please try again.";
}

function buildUrl(path: string, query?: QueryParams, base = API_BASE_URL): string {
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function networkError(): ApiError {
  return new ApiError(
    0,
    "We could not reach the Upchaar API. Check your connection and try again.",
  );
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, query, signal, token, anonymous = false } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const bearer = anonymous ? null : token !== undefined ? token : accessToken;
  if (bearer !== null && bearer.length > 0) headers["Authorization"] = `Bearer ${bearer}`;

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw networkError();
  }
}

/** Unwraps the envelope, or throws a typed `ApiError`. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await send(path, options);
  const payload = await readJson(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      readMessage(payload, statusFallback(response.status)),
      isRecord(payload) ? readFieldErrors(payload["errors"]) : null,
    );
  }

  if (!isRecord(payload)) {
    throw new ApiError(response.status, "The server returned an unexpected response.");
  }

  return payload["data"] as T;
}

/* ---------------------------------------------------------------- endpoints */

export type DoctorSession = { token: string; doctor: Doctor };
export type MeResponse = { role: Role; profile: Doctor };

/**
 * `POST /queue/department/:id/next` answers with everything the console needs
 * to repaint in one go — see the "as-built" notes in `docs/API_CONTRACT.md`.
 */
export type CallNextResult = {
  completed: Appointment | null;
  nowServing: Appointment | null;
  queue: DepartmentQueue;
};

export type AppointmentListParams = {
  status?: AppointmentStatus;
  /** `YYYY-MM-DD`, matched against the appointment's scheduled day. */
  date?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
};

export const api = {
  auth: {
    login: (input: LoginInput) =>
      apiRequest<DoctorSession>("/auth/doctor/login", {
        method: "POST",
        body: input,
        anonymous: true,
      }),

    changePassword: (input: ChangePasswordInput) =>
      apiRequest<{ doctor: Doctor }>("/auth/doctor/change-password", {
        method: "POST",
        body: input,
      }),

    me: (token?: string) => apiRequest<MeResponse>("/auth/me", { token }),
  },

  doctors: {
    me: () => apiRequest<Doctor>("/doctors/me"),

    updateProfile: (input: DoctorSelfUpdateInput) =>
      apiRequest<Doctor>("/doctors/me", { method: "PATCH", body: input }),

    setAvailability: (isAvailable: boolean) =>
      apiRequest<Doctor>("/doctors/me/availability", {
        method: "PATCH",
        body: { isAvailable },
      }),

    stats: () => apiRequest<DoctorStats>("/doctors/me/stats"),
  },

  departments: {
    list: (hospitalId: string) =>
      apiRequest<Department[]>("/departments", {
        query: { hospitalId },
        anonymous: true,
      }),
  },

  appointments: {
    list: (params: AppointmentListParams, signal?: AbortSignal) =>
      apiRequest<Paginated<Appointment>>("/appointments", {
        query: { ...params, limit: params.limit ?? 10 },
        signal,
      }),

    get: (id: string) => apiRequest<Appointment>(`/appointments/${id}`),

    setStatus: (id: string, status: AppointmentStatus, notes?: string) =>
      apiRequest<Appointment>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: { status, notes },
      }),
  },

  queue: {
    forDepartment: (departmentId: string) =>
      apiRequest<DepartmentQueue>(`/queue/department/${departmentId}`),

    callNext: (departmentId: string) =>
      apiRequest<CallNextResult>(`/queue/department/${departmentId}/next`, {
        method: "POST",
      }),
  },

  records: {
    forPatient: (patientId: string) =>
      apiRequest<PatientRecord>(`/records/patient/${patientId}`),
  },

  referrals: {
    list: () => apiRequest<Referral[]>("/referrals"),
    create: (input: CreateReferralInput) =>
      apiRequest<Referral>("/referrals", { method: "POST", body: input }),
    connect: (id: string, body?: { doctorId?: string }) =>
      apiRequest<Referral>(`/referrals/${id}/connect`, { method: "POST", body: body ?? {} }),
    myReferrals: () => apiRequest<Referral[]>("/referrals/my"),
  },
} as const;

/* ------------------------------------------------------------------- SSE */

/** `EventSource` cannot set headers, so the token rides in the query string. */
export function streamUrl(path: string, token: string): string {
  return buildUrl(path, { token }, BROWSER_API_BASE_URL);
}
