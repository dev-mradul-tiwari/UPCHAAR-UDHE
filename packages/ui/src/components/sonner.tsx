"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast, type ToasterProps } from "sonner";

import { useOptionalTheme } from "./theme-provider";

export { toast };
export type { ToasterProps };

/**
 * App-wide toast host. Mount once in the root layout, below `<ThemeProvider>`
 * so it can follow the active theme. Styled purely with design tokens.
 */
export function Toaster({ position = "bottom-right", ...props }: ToasterProps) {
  const theme = useOptionalTheme();

  return (
    <SonnerToaster
      data-slot="toaster"
      theme={theme?.resolvedTheme ?? "system"}
      position={position}
      closeButton
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-success-subtle)",
          "--success-text": "var(--color-success-subtle-foreground)",
          "--success-border": "var(--color-success-subtle)",
          "--error-bg": "var(--color-destructive-subtle)",
          "--error-text": "var(--color-destructive-subtle-foreground)",
          "--error-border": "var(--color-destructive-subtle)",
          "--warning-bg": "var(--color-warning-subtle)",
          "--warning-text": "var(--color-warning-subtle-foreground)",
          "--warning-border": "var(--color-warning-subtle)",
          "--info-bg": "var(--color-info-subtle)",
          "--info-text": "var(--color-info-subtle-foreground)",
          "--info-border": "var(--color-info-subtle)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-soft font-sans text-sm",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
