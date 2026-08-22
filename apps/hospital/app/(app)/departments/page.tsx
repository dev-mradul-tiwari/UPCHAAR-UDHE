import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@upchaar/ui/skeleton";

import { DepartmentsContent } from "@/components/departments/departments-content";

export const metadata: Metadata = { title: "Departments" };

export default function DepartmentsPage() {
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
      <DepartmentsContent />
    </Suspense>
  );
}
