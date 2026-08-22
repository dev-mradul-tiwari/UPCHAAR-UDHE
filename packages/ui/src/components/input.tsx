import * as React from "react";

import { cn } from "../lib/utils";

/** Shared field chrome so input / textarea / select trigger look identical. */
export const fieldBaseClass = [
  "flex w-full min-w-0 rounded-lg border border-input bg-card text-sm text-foreground",
  "shadow-[0_1px_0_0_var(--color-border)_inset] transition-[color,box-shadow,border-color]",
  "placeholder:text-muted-foreground",
  "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
].join(" ");

export interface InputProps extends React.ComponentProps<"input"> {
  /** Optional leading icon rendered inside the field. */
  icon?: React.ReactNode;
}

export function Input({ className, type = "text", icon, ...props }: InputProps) {
  const field = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBaseClass,
        "h-10 px-3 py-2",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        icon ? "pl-9" : undefined,
        className,
      )}
      {...props}
    />
  );

  if (!icon) return field;

  return (
    <div data-slot="input-wrapper" className="relative w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground [&_svg]:size-4"
      >
        {icon}
      </span>
      {field}
    </div>
  );
}
