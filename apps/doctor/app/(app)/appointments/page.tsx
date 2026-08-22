import type { Metadata } from "next";
import { Suspense } from "react";

import { AppointmentsContent } from "@/components/appointments/content";

export const metadata: Metadata = { title: "Appointments" };

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentsSkeleton />}>
      <AppointmentsContent />
    </Suspense>
  );
}

function AppointmentsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
        <div className="rounded-lg border border-border p-6 h-96 bg-muted animate-pulse" />
      </div>
    </div>
  );
}
