"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

export type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>;

export function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>;

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 rounded-xl bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5",
        "text-sm font-medium whitespace-nowrap transition-colors",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content>;

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    />
  );
}
