"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";

import { cn } from "../lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export type SheetSide = "top" | "right" | "bottom" | "left";

const sideClasses: Record<SheetSide, string> = {
  right:
    "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:translate-x-full",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:-translate-x-full",
  top: "inset-x-0 top-0 h-auto max-h-[80dvh] border-b data-[state=closed]:-translate-y-full",
  bottom:
    "inset-x-0 bottom-0 h-auto max-h-[80dvh] border-t data-[state=closed]:translate-y-full",
};

export function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]",
        "data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

export interface SheetContentProps extends React.ComponentProps<
  typeof SheetPrimitive.Content
> {
  side?: SheetSide;
  showCloseButton?: boolean;
}

export function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-5 border-border bg-popover p-6 text-popover-foreground shadow-soft",
          "overflow-y-auto transition-transform duration-200 ease-out",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className={cn(
              "absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg",
              "text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
            )}
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 pr-8 text-left", className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg leading-tight font-semibold", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
