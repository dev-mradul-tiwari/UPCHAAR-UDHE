import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export const alertVariants = cva(
  [
    "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-xl border px-4 py-3.5 text-sm",
    "has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-3",
    "[&>svg]:size-4.5 [&>svg]:translate-y-0.5",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-card-foreground [&>svg]:text-muted-foreground",
        primary:
          "border-transparent bg-primary-subtle text-primary-subtle-foreground [&>svg]:text-primary-subtle-foreground",
        success:
          "border-transparent bg-success-subtle text-success-subtle-foreground [&>svg]:text-success-subtle-foreground",
        warning:
          "border-transparent bg-warning-subtle text-warning-subtle-foreground [&>svg]:text-warning-subtle-foreground",
        info: "border-transparent bg-info-subtle text-info-subtle-foreground [&>svg]:text-info-subtle-foreground",
        destructive:
          "border-transparent bg-destructive-subtle text-destructive-subtle-foreground [&>svg]:text-destructive-subtle-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface AlertProps
  extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 min-h-4 font-semibold tracking-tight text-current",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm opacity-90 [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
