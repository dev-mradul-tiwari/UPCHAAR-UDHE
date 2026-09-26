/**
 * Minimal typed API client for the health-worker portal.
 *
 * Mirrors the pattern used in apps/patient/lib/api.ts and apps/doctor/lib/api.ts.
 * Uses NEXT_PUBLIC_API_URL (browser + server) or API_URL (server-only, e.g. Docker).
 */

const DEFAULT_API_URL = "http://localhost:4000/api/v1";

export const API_BASE_URL = (
  (typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)
    : process.env.NEXT_PUBLIC_API_URL) ?? DEFAULT_API_URL
).replace(/\/+$/, "");

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
  anonymous?: boolean;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, token, anonymous = false } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!anonymous && token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text.length > 0 ? (JSON.parse(text) as { data: T }) : null;

  if (!response.ok || !payload) {
    throw new Error(`API ${method} ${path} failed: ${response.status}`);
  }

  return payload.data;
}
