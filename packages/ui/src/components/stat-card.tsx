import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "../lib/utils";
import { Skeleton } from "./skeleton";

export type StatTone =
  "neutral" | "primary" | "success" | "warning" | "destructive" | "info";
export type DeltaDirection = "up" | "down" | "flat";

export interface StatDelta {
  /** Already-formatted magnitude, e.g. `"12%"` or `"+3"`. */
  value: string;
  direction: DeltaDirection;
  /** Context for the change, e.g. `"vs. yesterday"`. */
  label?: string;
  /**
   * Whether an increase is good. Bed occupancy going up is bad, appointments
   * going up is good. Defaults to `true`.
   */
  positiveIsGood?: boolean;
}

const iconToneClass: Record<StatTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-subtle text-primary-subtle-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  destructive: "bg-destructive-subtle text-destructive-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
};

function deltaClass(delta: StatDelta): string {
  if (delta.direction === "flat") return "text-muted-foreground";
  const good = delta.positiveIsGood ?? true;
  const isGood = delta.direction === "up" ? good : !good;
  return isGood ? "text-success-subtle-foreground" : "text-destructive-subtle-foreground";
}

function DeltaIcon({ direction }: { direction: DeltaDirection }) {
  if (direction === "up") return <ArrowUpRight aria-hidden className="size-3.5" />;
  if (direction === "down") return <ArrowDownRight aria-hidden className="size-3.5" />;
  return <Minus aria-hidden className="size-3.5" />;
}

export interface StatCardProps extends React.ComponentProps<"div"> {
  label: React.ReactNode;
  /** The headline number. Pre-format it (currency, %, etc.). */
  value: React.ReactNode;
  /** Small unit rendered next to the value, e.g. `"beds"`. */
  unit?: React.ReactNode;
  delta?: StatDelta;
  icon?: React.ReactNode;
  tone?: StatTone;
  /** Extra line under the value. */
  hint?: React.ReactNode;
  loading?: boolean;
}

/** KPI tile used across the hospital and doctor dashboards. */
export function StatCard({
  label,
  value,
  unit,
  delta,
  icon,
  tone = "primary",
  hint,
  loading = false,
  className,
  children,
  ...props
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon ? (
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4.5",
              iconToneClass[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums text-foreground">
            {value}
          </span>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>
      )}

      {delta && !loading ? (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              deltaClass(delta),
            )}
          >
            <DeltaIcon direction={delta.direction} />
            {delta.value}
          </span>
          {delta.label ? (
            <span className="text-muted-foreground">{delta.label}</span>
          ) : null}
        </div>
      ) : null}

      {hint && !loading ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {children}
    </div>
  );
}

/** Responsive grid for a row of `StatCard`s. */
export function StatCardGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-grid"
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
      {...props}
    />
  );
}
