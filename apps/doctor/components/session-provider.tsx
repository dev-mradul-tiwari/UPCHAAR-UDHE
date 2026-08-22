"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { Doctor } from "@upchaar/types";

import { api, getAccessToken, isApiError, setAccessToken } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/session";

const SessionTokenContext = React.createContext<string | null>(null);

export interface SessionProviderProps {
  /** The bearer token read from the httpOnly cookie by the root layout. */
  token: string | null;
  children: React.ReactNode;
}

/**
 * Publishes the session token to the client. The token is only ever read from
 * the cookie on the server; this hands it to the API client (and to
 * `EventSource`, which cannot send an `Authorization` header).
 */
export function SessionProvider({ token, children }: SessionProviderProps) {
  // Set synchronously so children can fetch on their very first render.
  if (getAccessToken() !== token) setAccessToken(token);

  React.useEffect(() => {
    setAccessToken(token);
  }, [token]);

  return (
    <SessionTokenContext.Provider value={token}>{children}</SessionTokenContext.Provider>
  );
}

/** The raw bearer token, or `null` when signed out. */
export function useSessionToken(): string | null {
  return React.useContext(SessionTokenContext);
}

export const doctorQueryKey = ["session", "me"] as const;

/** The signed-in doctor's profile. */
export function useDoctor(): UseQueryResult<Doctor, Error> {
  const token = useSessionToken();
  return useQuery({
    queryKey: doctorQueryKey,
    queryFn: () => api.doctors.me(),
    enabled: token !== null,
    staleTime: 5 * 60_000,
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status < 500) && failureCount < 2,
  });
}

/** Clears the cookie, drops cached data and returns to the login screen. */
export function useSignOut(): () => Promise<void> {
  const router = useRouter();
  const queryClient = useQueryClient();

  return React.useCallback(async () => {
    try {
      await fetch("/api/session", { method: "DELETE" });
    } finally {
      setAccessToken(null);
      queryClient.clear();
      router.replace(LOGIN_PATH);
      router.refresh();
    }
  }, [queryClient, router]);
}

/** Stores the token in the httpOnly cookie after a successful login/signup. */
export async function createSession(token: string): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error("We could not start your session. Please try again.");
  setAccessToken(token);
}
