"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { HospitalDetail } from "@upchaar/types";

import { api, getAccessToken, isApiError, setAccessToken } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/session";

const SessionTokenContext = React.createContext<string | null>(null);

export interface SessionProviderProps {
  token: string | null;
  children: React.ReactNode;
}

export function SessionProvider({ token, children }: SessionProviderProps) {
  if (getAccessToken() !== token) setAccessToken(token);

  React.useEffect(() => {
    setAccessToken(token);
  }, [token]);

  return (
    <SessionTokenContext.Provider value={token}>{children}</SessionTokenContext.Provider>
  );
}

export function useSessionToken(): string | null {
  return React.useContext(SessionTokenContext);
}

export const hospitalQueryKey = ["session", "me"] as const;

export function useHospital(): UseQueryResult<HospitalDetail, Error> {
  const token = useSessionToken();
  return useQuery({
    queryKey: hospitalQueryKey,
    queryFn: async () => api.hospital.me(),
    enabled: token !== null,
    staleTime: 5 * 60_000,
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status < 500) && failureCount < 2,
  });
}

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

export async function createSession(token: string): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error("We could not start your session. Please try again.");
  setAccessToken(token);
}
