"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export type ColumnAlign = "left" | "center" | "right";

export interface DataTableColumn<TRow> {
  /** Stable key for the column. */
  id: string;
  header: React.ReactNode;
  /** Render the cell for a row. */
  cell: (row: TRow, rowIndex: number) => React.ReactNode;
  align?: ColumnAlign;
  /** Extra classes applied to both the `<th>` and the `<td>`. */
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  /** Hide below the `sm` breakpoint — useful for dense hospital tables. */
  hideBelow?: "sm" | "md" | "lg";
}

export interface DataTableProps<TRow> extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  columns: ReadonlyArray<DataTableColumn<TRow>>;
  rows: ReadonlyArray<TRow>;
  /** Stable React key per row — usually the record id. */
  getRowId: (row: TRow, index: number) => string;
  loading?: boolean;
  /** How many shimmer rows to draw while loading. */
  skeletonRows?: number;
  /** Fully custom empty state; overrides the `empty*` props below. */
  emptyState?: React.ReactNode;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  caption?: React.ReactNode;
  /** Makes rows activatable by click, Enter and Space. */
  onRowClick?: (row: TRow, index: number) => void;
  /** Accessible label for the whole table when there is no visible caption. */
  ariaLabel?: string;
  /** Highlight a row, e.g. the patient currently being seen. */
  isRowSelected?: (row: TRow, index: number) => boolean;
}

const alignClass: Record<ColumnAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const hideBelowClass = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

/**
 * Thin, fully typed wrapper over the table primitives that owns the two states
 * every list in this product needs: loading skeleton and empty state.
 */
export function DataTable<TRow>({
  columns,
  rows,
  getRowId,
  loading = false,
  skeletonRows = 5,
  emptyState,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon,
  emptyAction,
  caption,
  onRowClick,
  ariaLabel,
  isRowSelected,
  className,
  ...props
}: DataTableProps<TRow>) {
  const showEmpty = !loading && rows.length === 0;

  return (
    <div
      data-slot="data-table"
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      {...props}
    >
      <Table aria-label={ariaLabel} aria-busy={loading || undefined}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                scope="col"
                className={cn(
                  alignClass[column.align ?? "left"],
                  column.hideBelow ? hideBelowClass[column.hideBelow] : null,
                  column.className,
                  column.headerClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading
            ? Array.from({ length: Math.max(1, skeletonRows) }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.hideBelow ? hideBelowClass[column.hideBelow] : null,
                        column.className,
                      )}
                    >
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row, rowIndex) => {
                const selected = isRowSelected?.(row, rowIndex) ?? false;
                return (
                  <TableRow
                    key={getRowId(row, rowIndex)}
                    data-state={selected ? "selected" : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            onRowClick(row, rowIndex);
                          }
                        : undefined
                    }
                    className={cn(
                      onRowClick
                        ? "cursor-pointer outline-none focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
                        : null,
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          alignClass[column.align ?? "left"],
                          column.hideBelow ? hideBelowClass[column.hideBelow] : null,
                          column.className,
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row, rowIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>

      {showEmpty ? (
        <div className="border-t border-border">
          {emptyState ?? (
            <EmptyState
              variant="plain"
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
