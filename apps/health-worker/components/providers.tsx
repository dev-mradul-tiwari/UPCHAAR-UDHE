"use client";

import * as React from "react";
import { LanguageProvider } from "@upchaar/ui/language-provider";
import { ThemeProvider } from "@upchaar/ui/theme-provider";
import { Toaster } from "@upchaar/ui/sonner";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
        <Toaster />
      </LanguageProvider>
    </ThemeProvider>
  );
}
