"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "../lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps extends React.ComponentProps<
  typeof SelectPrimitive.Trigger
> {
  size?: "sm" | "default";
}

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-card",
        "px-3 text-sm text-foreground whitespace-nowrap",
        "shadow-[0_1px_0_0_var(--color-border)_inset] transition-[color,box-shadow,border-color]",
        "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
        "data-[placeholder]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        size === "sm" ? "h-8 text-xs" : "h-10",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden className="size-4 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export type SelectContentProps = React.ComponentProps<typeof SelectPrimitive.Content>;

export function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 6,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-32 overflow-hidden",
          "rounded-xl border border-border bg-popover text-popover-foreground shadow-soft",
          "data-[state=open]:animate-fade-in",
          position === "popper" &&
            "w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-0",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-muted-foreground">
          <ChevronUp aria-hidden className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-muted-foreground">
          <ChevronDown aria-hidden className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export type SelectLabelProps = React.ComponentProps<typeof SelectPrimitive.Label>;

export function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-2xs font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export type SelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>;

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-2 text-sm",
        "outline-none select-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[state=checked]:font-medium",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden className="size-4 text-primary-subtle-foreground" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

export type SelectSeparatorProps = React.ComponentProps<typeof SelectPrimitive.Separator>;

export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
