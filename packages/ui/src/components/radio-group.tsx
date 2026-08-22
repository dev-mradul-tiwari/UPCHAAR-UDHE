"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

export type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root>;

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

export type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item>;

export function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4.5 shrink-0 rounded-full border border-input bg-card",
        "transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center after:block after:size-2.5 after:rounded-full after:bg-primary after:content-['']"
      />
    </RadioGroupPrimitive.Item>
  );
}

export interface RadioCardProps extends RadioGroupItemProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

/** A radio rendered as a selectable card — used by the booking flows. */
export function RadioCard({
  label,
  description,
  className,
  id,
  ...props
}: RadioCardProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <label
      htmlFor={inputId}
      data-slot="radio-card"
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4",
        "transition-colors hover:bg-accent/60",
        "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60",
        className,
      )}
    >
      <RadioGroupItem id={inputId} className="mt-0.5" {...props} />
      <span className="grid gap-1">
        <span className="text-sm leading-none font-medium text-foreground">{label}</span>
        {description ? (
          <span className="text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
