"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

export type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider>;

export function TooltipProvider({ delayDuration = 200, ...props }: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content>;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit max-w-xs rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background",
          "text-balance data-[state=delayed-open]:animate-fade-in",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="size-2.5 translate-y-[calc(-50%_-_1px)] rotate-45 rounded-[2px] fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export interface TooltipProps extends React.ComponentProps<typeof TooltipPrimitive.Root> {
  /** Tooltip body. */
  content: React.ReactNode;
  side?: TooltipContentProps["side"];
  align?: TooltipContentProps["align"];
  children: React.ReactNode;
}

/**
 * Self-contained tooltip: wraps its own provider so a single element can be
 * annotated without app-level setup.
 */
export function Tooltip({ content, side, align, children, ...props }: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root {...props}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}
