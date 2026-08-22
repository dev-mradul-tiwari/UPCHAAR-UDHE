import * as React from "react";

import { cn } from "../lib/utils";

export type SkeletonProps = React.ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-shimmer rounded-lg bg-muted", className)}
      {...props}
    />
  );
}

export interface SkeletonTextProps extends React.ComponentProps<"div"> {
  /** Number of shimmer lines to render. */
  lines?: number;
}

/** A block of placeholder text lines; the last line is deliberately shorter. */
export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div
      data-slot="skeleton-text"
      role="status"
      aria-label="Loading"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 && lines > 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
