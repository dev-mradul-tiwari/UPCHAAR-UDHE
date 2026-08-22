import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@upchaar/ui/skeleton";

import { DoctorsContent } from "@/components/doctors/doctors-content";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
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
      <DoctorsContent />
    </Suspense>
  );
}
