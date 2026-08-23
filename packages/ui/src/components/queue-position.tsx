import * as React from "react";
import { Clock, Users } from "lucide-react";

import { cn } from "../lib/utils";
import { Skeleton } from "./skeleton";

import { useLanguage } from "./language-provider";

export interface QueuePositionProps extends React.ComponentProps<"div"> {
  /** 1-based live position. `null` while unknown. */
  position: number | null;
  /** People ahead in the queue. */
  peopleAhead?: number;
  /** Estimated wait in minutes. */
  estimatedWaitMinutes?: number;
  /** Copy above the number. */
  label?: React.ReactNode;
  loading?: boolean;
  /** `card` adds the bordered surface; `bare` is for embedding. */
  variant?: "card" | "bare";
}

/**
 * The headline patient-facing display: a very large queue number with the
 * supporting people-ahead and estimated-wait facts. Announces changes politely
 * so screen-reader users hear the queue advance.
 */
export function QueuePosition({
  position,
  peopleAhead,
  estimatedWaitMinutes,
  label,
  loading = false,
  variant = "card",
  className,
  children,
  ...props
}: QueuePositionProps) {
  const { language, t } = useLanguage();
  const isNext = position !== null && position <= 1;
  const displayLabel = label ?? t("position_in_queue");

  const formatWait = (minutes: number): string => {
    if (minutes <= 0) return language === "hi" ? "किसी भी क्षण" : "Any moment now";
    if (minutes < 60) return language === "hi" ? `~${minutes} मिनट` : `~${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0
      ? (language === "hi" ? `~${hours} घंटे` : `~${hours} hr`)
      : (language === "hi" ? `~${hours} घंटे ${rest} मिनट` : `~${hours} hr ${rest} min`);
  };

  return (
    <div
      data-slot="queue-position"
      className={cn(
        "flex flex-col items-center gap-4 text-center",
        variant === "card"
          ? "rounded-xl border border-border bg-card px-6 py-8 shadow-soft"
          : null,
        className,
      )}
      {...props}
    >
      <span className="text-sm font-medium text-muted-foreground">{displayLabel}</span>

      {loading ? (
        <Skeleton className="h-20 w-28" />
      ) : (
        <p
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "flex items-baseline gap-1 leading-none font-semibold tabular-nums",
            isNext ? "text-success-subtle-foreground" : "text-primary-subtle-foreground",
          )}
        >
          <span aria-hidden className="text-2xl opacity-50">
            #
          </span>
          <span className="text-6xl">{position ?? "—"}</span>
          <span className="sr-only">
            {position === null
              ? "Queue position unavailable"
              : `Queue position ${position}`}
          </span>
        </p>
      )}

      {isNext && !loading ? (
        <span className="rounded-full bg-success-subtle px-3 py-1 text-xs font-semibold text-success-subtle-foreground">
          {language === "hi" ? "आपकी बारी है" : "You are next"}
        </span>
      ) : null}

      {!loading && (peopleAhead !== undefined || estimatedWaitMinutes !== undefined) ? (
        <dl className="flex items-center gap-6">
          {peopleAhead !== undefined ? (
            <div className="flex flex-col items-center gap-1">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users aria-hidden className="size-3.5" />
                {t("ahead_of_you")}
              </dt>
              <dd className="text-lg font-semibold tabular-nums text-foreground">
                {peopleAhead}
              </dd>
            </div>
          ) : null}

          {estimatedWaitMinutes !== undefined ? (
            <div className="flex flex-col items-center gap-1">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock aria-hidden className="size-3.5" />
                {t("estimated_wait")}
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatWait(estimatedWaitMinutes)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {children}
    </div>
  );
}
