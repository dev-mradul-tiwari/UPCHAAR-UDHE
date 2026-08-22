import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@upchaar/ui/skeleton";

import { InventoryContent } from "@/components/inventory/inventory-content";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
