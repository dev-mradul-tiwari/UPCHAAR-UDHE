"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { clamp, cn } from "../lib/utils";

export interface ProgressProps extends React.ComponentProps<
  typeof ProgressPrimitive.Root
> {
  /** Colour of the filled portion. */
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
  /** Track height. */
  size?: "sm" | "default" | "lg";
}

const toneClass: Record<NonNullable<ProgressProps["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

const sizeClass: Record<NonNullable<ProgressProps["size"]>, string> = {
  sm: "h-1.5",
  default: "h-2.5",
  lg: "h-3.5",
};

export function Progress({
  className,
  value,
  max = 100,
  tone = "primary",
  size = "default",
  ...props
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const current = clamp(value ?? 0, 0, safeMax);
  const percent = (current / safeMax) * 100;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={current}
      max={safeMax}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 rounded-full transition-transform",
          toneClass[tone],
        )}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
