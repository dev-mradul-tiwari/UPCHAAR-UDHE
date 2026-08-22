import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1.5",
    "rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
    "transition-colors",
    "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-card text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        primary: "border-transparent bg-primary-subtle text-primary-subtle-foreground",
        success: "border-transparent bg-success-subtle text-success-subtle-foreground",
        warning: "border-transparent bg-warning-subtle text-warning-subtle-foreground",
        info: "border-transparent bg-info-subtle text-info-subtle-foreground",
        destructive:
          "border-transparent bg-destructive-subtle text-destructive-subtle-foreground",
        solidDestructive: "border-transparent bg-destructive text-destructive-foreground",
      },
      size: {
        sm: "px-2 py-0 text-2xs",
        default: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
