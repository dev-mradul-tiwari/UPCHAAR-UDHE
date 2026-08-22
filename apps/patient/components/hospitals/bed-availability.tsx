"use client";

import { BedDouble } from "lucide-react";
import type { BedSummary, BedType } from "@upchaar/types";
import { Badge } from "@upchaar/ui/badge";
import { Progress } from "@upchaar/ui/progress";

const BED_LABELS: Record<BedType, string> = {
  ICU: "ICU",
  GENERAL: "General",
  PREMIUM: "Premium",
};

const ORDER: readonly BedType[] = ["ICU", "GENERAL", "PREMIUM"];

function sortBeds(beds: BedSummary[]): BedSummary[] {
  return [...beds].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
}

function tone(available: number, total: number): "success" | "warning" | "destructive" {
  if (available === 0) return "destructive";
  if (total > 0 && available / total < 0.15) return "warning";
  return "success";
}

/** Compact chips for a search result card. */
export function BedChips({ beds }: { beds: BedSummary[] }) {
  if (beds.length === 0) {
    return <p className="text-sm text-muted-foreground">No bed data published.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {sortBeds(beds).map((bed) => (
        <li key={bed.type}>
          <Badge variant={tone(bed.available, bed.total)}>
            <BedDouble aria-hidden />
            {BED_LABELS[bed.type]} {bed.available}
            <span className="opacity-70">/ {bed.total}</span>
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** Full breakdown with occupancy bars, for the hospital detail page. */
export function BedStats({ beds }: { beds: BedSummary[] }) {
  if (beds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This hospital has not published bed availability yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {sortBeds(beds).map((bed) => {
        const occupied = bed.total - bed.available;
        const percent = bed.total === 0 ? 0 : Math.round((occupied / bed.total) * 100);
        const badge = tone(bed.available, bed.total);
        return (
          <li
            key={bed.type}
            className="grid gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {BED_LABELS[bed.type]}
              </span>
              <span className="text-2xs text-muted-foreground">{percent}% occupied</span>
            </div>
            <p className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {bed.available}
              </span>
              <span className="text-sm text-muted-foreground">of {bed.total} free</span>
            </p>
            <Progress
              value={percent}
              size="sm"
              tone={badge === "success" ? "success" : badge === "warning" ? "warning" : "destructive"}
              aria-label={`${BED_LABELS[bed.type]} beds occupied`}
            />
          </li>
        );
      })}
    </ul>
  );
}
