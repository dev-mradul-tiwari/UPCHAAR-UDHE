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
  BookAppointmentInput,
  ChatMessage,
  CreateFeedbackInput,
  Department,
  Doctor,
  DrugInteractionReport,
  Feedback,
  HospitalDetail,
  HospitalSummary,
  LoginInput,
  MedicalHistoryInput,
  Paginated,
  PatientProfile,
  PatientRecord,
  PatientRegisterInput,
  QueueStatus,
  Referral,
  Role,
  SlotAvailability,
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

  /** First message for a field path, e.g. `"medicalHistory.notes"`. */
  fieldError(path: string): string | undefined {
    return this.errors?.[path]?.[0];
  }

  get isOffline(): boolean {
    return this.status === 0;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** The AI routes answer 503 while `GEMINI_API_KEY` is unset. */
  get isUnavailable(): boolean {
    return this.status === 503;
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
    "We could not reach Upchaar. Check your connection and try again.",
  );
}

async function send(
  path: string,
  options: RequestOptions,
  accept: string,
): Promise<Response> {
  const { method = "GET", body, query, signal, token, anonymous = false } = options;

  const headers: Record<string, string> = { Accept: accept };
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
  const response = await send(path, options, "application/json");
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

export type PatientSession = { token: string; patient: PatientProfile };
export type MeResponse = { role: Role; profile: PatientProfile };

export type AppointmentListParams = {
  status?: AppointmentStatus;
  page?: number;
  limit?: number;
};

export type HospitalSearchParams = {
  q?: string;
  city?: string;
  departmentId?: string;
  hasBeds?: boolean;
  page?: number;
  limit?: number;
};

export const api = {
  auth: {
    login: (input: LoginInput) =>
      apiRequest<PatientSession>("/auth/patient/login", {
        method: "POST",
        body: input,
        anonymous: true,
      }),

    register: (input: PatientRegisterInput) =>
      apiRequest<PatientSession>("/auth/patient/register", {
        method: "POST",
        body: input,
        anonymous: true,
      }),

    me: (token?: string) => apiRequest<MeResponse>("/auth/me", { token }),
  },

  hospitals: {
    search: (params: HospitalSearchParams, signal?: AbortSignal) =>
      apiRequest<Paginated<HospitalSummary>>("/hospitals", {
        query: { ...params, limit: params.limit ?? 9 },
        anonymous: true,
        signal,
      }),

    get: (id: string) => apiRequest<HospitalDetail>(`/hospitals/${id}`, { anonymous: true }),
  },

  departments: {
    list: (hospitalId?: string) =>
      apiRequest<Department[]>("/departments", {
        query: { hospitalId },
        anonymous: true,
      }),
  },

  doctors: {
    list: (params: { hospitalId?: string; departmentId?: string }) =>
      apiRequest<Doctor[]>("/doctors", { query: params, anonymous: true }),
  },

  appointments: {
    mine: (params: AppointmentListParams) =>
      apiRequest<Paginated<Appointment>>("/appointments/mine", {
        query: { ...params, limit: params.limit ?? 10 },
      }),

    get: (id: string) => apiRequest<Appointment>(`/appointments/${id}`),

    book: (input: BookAppointmentInput) =>
      apiRequest<Appointment>("/appointments", { method: "POST", body: input }),

    cancel: (id: string) =>
      apiRequest<Appointment>(`/appointments/${id}`, { method: "DELETE" }),
  },

  queue: {
    forAppointment: (id: string) =>
      apiRequest<QueueStatus>(`/queue/appointment/${id}`),

    slots: (hospitalId: string, departmentId: string, date: string) =>
      apiRequest<SlotAvailability[]>("/queue/slots", {
        query: { hospitalId, departmentId, date },
        anonymous: true,
      }),
  },

  records: {
    mine: (token?: string) => apiRequest<PatientRecord>("/records/me", { token }),

    save: (input: MedicalHistoryInput) =>
      apiRequest<PatientRecord>("/records/me", { method: "PUT", body: input }),

    updatePhone: (phone: string) =>
      apiRequest<PatientRecord>("/records/me/phone", { method: "PATCH", body: { phone } }),
  },

  ai: {
    drugInteraction: (medicines: string[]) =>
      apiRequest<DrugInteractionReport>("/ai/drug-interaction", {
        method: "POST",
        body: { medicines },
      }),
  },

  referrals: {
    myReferrals: () => apiRequest<Referral[]>("/referrals/my"),
  },

  feedback: {
    submit: (input: CreateFeedbackInput) =>
      apiRequest<Feedback>("/feedback", { method: "POST", body: input }),
    pending: () =>
      apiRequest<
        Array<{
          appointmentId: string;
          scheduledFor: string;
          completedAt: string | null;
          doctor: { id: string; name: string; specialization: string } | null;
          hospital: { id: string; name: string; city: string } | null;
        }>
      >("/feedback/pending"),
  },
} as const;

/* ------------------------------------------------------------ AI streaming */

/**
 * Dr. Positive replies as `text/plain`, token by token. Failures *before* the
 * first byte still use the JSON envelope, so those become a normal `ApiError`
 * (503 while `GEMINI_API_KEY` is unset).
 */
export async function* streamChatReply(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, void> {
  const response = await send(
    "/ai/chat",
    { method: "POST", body: { messages }, signal },
    "text/plain",
  );

  if (!response.ok) {
    const payload = await readJson(response);
    throw new ApiError(
      response.status,
      readMessage(payload, statusFallback(response.status)),
      isRecord(payload) ? readFieldErrors(payload["errors"]) : null,
    );
  }

  const body = response.body;
  if (body === null) {
    throw new ApiError(response.status, "Dr. Positive sent an empty reply.");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.length > 0) yield chunk;
    }
    const tail = decoder.decode();
    if (tail.length > 0) yield tail;
  } finally {
    reader.releaseLock();
  }
}

/* ------------------------------------------------------------------- SSE */

/** `EventSource` cannot set headers, so the token rides in the query string. */
export function streamUrl(path: string, token: string): string {
  return buildUrl(path, { token }, BROWSER_API_BASE_URL);
}
