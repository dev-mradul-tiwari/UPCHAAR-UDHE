"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";

type PageToken = number | "ellipsis";

/**
 * Page tokens with at most one ellipsis on each side:
 * `1 … 4 5 6 … 20`
 */
export function paginationRange(
  page: number,
  totalPages: number,
  siblings = 1,
): PageToken[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];

  const totalSlots = siblings * 2 + 5;
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, totalPages - 1);
  const tokens: PageToken[] = [1];

  if (left > 2) tokens.push("ellipsis");
  for (let i = left; i <= right; i += 1) tokens.push(i);
  if (right < totalPages - 1) tokens.push("ellipsis");

  tokens.push(totalPages);
  return tokens;
}

export interface PaginationProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
  /** 1-based current page. */
  page: number;
  /** Total number of items across all pages. */
  total: number;
  /** Items per page. */
  limit: number;
  onPageChange: (page: number) => void;
  /** Render "Showing 1–20 of 133" above the controls. */
  showSummary?: boolean;
  /** Noun used in the summary line. */
  itemLabel?: string;
}

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
  showSummary = true,
  itemLabel = "results",
  className,
  ...props
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const current = Math.min(Math.max(1, page), totalPages);
  const tokens = paginationRange(current, totalPages);
  const from = total === 0 ? 0 : (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  return (
    <nav
      data-slot="pagination"
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className,
      )}
      {...props}
    >
      {showSummary ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total === 0
            ? `No ${itemLabel}`
            : `Showing ${from}–${to} of ${total} ${itemLabel}`}
        </p>
      ) : (
        <span />
      )}

      <ul className="flex items-center gap-1">
        <li>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
        </li>

        {tokens.map((token, index) =>
          token === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden className="px-1">
              <MoreHorizontal className="size-4 text-muted-foreground" />
              <span className="sr-only">More pages</span>
            </li>
          ) : (
            <li key={token}>
              <Button
                type="button"
                variant={token === current ? "default" : "ghost"}
                size="icon-sm"
                aria-label={`Page ${token}`}
                aria-current={token === current ? "page" : undefined}
                onClick={() => onPageChange(token)}
              >
                {token}
              </Button>
            </li>
          ),
        )}

        <li>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={current >= totalPages}
            onClick={() => onPageChange(current + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </li>
      </ul>
    </nav>
  );
}
