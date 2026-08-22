import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "../lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,opacity] duration-150",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:ring-offset-1",
    "focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 focus-visible:ring-destructive/40",
        success: "bg-success text-success-foreground shadow-soft hover:bg-success/90",
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-subtle-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a `<button>` (e.g. a Next.js `<Link>`). */
  asChild?: boolean;
  /** Show a spinner and block interaction. Keeps the button in the tab order. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-loading={loading ? "true" : undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-disabled={asChild && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="animate-spin" /> : null}
      {/* Slottable marks the real element when `asChild` is set, so the spinner
          can sit next to it without breaking Slot's single-child rule. */}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  );
}
