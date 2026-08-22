import * as React from "react";
import { Calendar, Clock } from "lucide-react";

import { cn } from "../lib/utils";
import { fieldBaseClass } from "./input";

/** `YYYY-MM-DD` for a Date, in the local timezone (never shifts a day). */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today as `YYYY-MM-DD` — handy for a `min` bound on booking forms. */
export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

const iconWrapper =
  "pointer-events-none absolute top-1/2 left-3 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground";

const nativeIndicator =
  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 " +
  "[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full " +
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

export type DateInputProps = Omit<React.ComponentProps<"input">, "type">;

/**
 * Native date field — no calendar dependency. Uses the platform picker, which
 * is keyboard accessible and localised for free.
 */
export function DateInput({ className, ...props }: DateInputProps) {
  return (
    <div data-slot="date-input-wrapper" className="relative w-full">
      <span aria-hidden className={iconWrapper}>
        <Calendar className="size-4" />
      </span>
      <input
        type="date"
        data-slot="date-input"
        className={cn(
          fieldBaseClass,
          "relative h-10 py-2 pr-3 pl-9 [color-scheme:inherit]",
          nativeIndicator,
          className,
        )}
        {...props}
      />
    </div>
  );
}

export type TimeInputProps = Omit<React.ComponentProps<"input">, "type">;

/** Native time field, styled to match `DateInput`. */
export function TimeInput({ className, ...props }: TimeInputProps) {
  return (
    <div data-slot="time-input-wrapper" className="relative w-full">
      <span aria-hidden className={iconWrapper}>
        <Clock className="size-4" />
      </span>
      <input
        type="time"
        data-slot="time-input"
        className={cn(
          fieldBaseClass,
          "relative h-10 py-2 pr-3 pl-9 [color-scheme:inherit]",
          nativeIndicator,
          className,
        )}
        {...props}
      />
    </div>
  );
}
