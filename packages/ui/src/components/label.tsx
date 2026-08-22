"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

export interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /** Renders a subtle required marker after the text. */
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 text-sm leading-none font-medium text-foreground select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden className="text-destructive-subtle-foreground">
          *
        </span>
      ) : null}
      {required ? <span className="sr-only">(required)</span> : null}
    </LabelPrimitive.Root>
  );
}
