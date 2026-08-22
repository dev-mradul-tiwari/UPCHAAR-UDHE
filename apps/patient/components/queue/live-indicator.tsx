"use client";

import { cn } from "@upchaar/ui/lib/utils";

import type { LiveConnection } from "@/hooks/use-live-queue";

const META: Record<LiveConnection, { label: string; dot: string; text: string }> = {
  idle: {
    label: "Not connected",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  connecting: {
    label: "Connecting",
    dot: "bg-info animate-pulse",
    text: "text-info-subtle-foreground",
  },
  live: {
    label: "Live",
    dot: "bg-success animate-pulse",
    text: "text-success-subtle-foreground",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-warning animate-pulse",
    text: "text-warning-subtle-foreground",
  },
};

export interface LiveIndicatorProps {
  connection: LiveConnection;
  className?: string;
}

/** The little breathing dot that tells a patient the number they see is fresh. */
export function LiveIndicator({ connection, className }: LiveIndicatorProps) {
  const meta = META[connection];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium",
        meta.text,
        className,
      )}
    >
      <span aria-hidden className={cn("size-2 rounded-full", meta.dot)} />
      <span role="status" aria-live="polite">
        {meta.label}
      </span>
    </span>
  );
}
