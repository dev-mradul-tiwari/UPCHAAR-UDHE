"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content>;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-soft",
          "outline-none data-[state=open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
