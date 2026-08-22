"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@upchaar/ui/theme-provider";
import { Toaster } from "@upchaar/ui/sonner";

import { isApiError } from "@/lib/api";
import { SessionProvider } from "./session-provider";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

export interface ProvidersProps {
  token: string | null;
  children: React.ReactNode;
}

export function Providers({ token, children }: ProvidersProps) {
  const [queryClient] = React.useState(createQueryClient);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider token={token}>{children}</SessionProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
