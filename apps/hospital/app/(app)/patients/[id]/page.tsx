import type { Metadata } from "next";
import { Suspense } from "react";

import { PatientRecordContent } from "@/components/patients/record-content";

export const metadata: Metadata = { title: "Patient Record" };

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<PatientRecordSkeleton />}>
      <PatientRecordContent patientId={id} />
    </Suspense>
  );
}

function PatientRecordSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-6 h-48 bg-muted animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
