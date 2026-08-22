import type { Metadata } from "next";
import { Suspense } from "react";

import { QueueContent } from "@/components/queue/content";

export const metadata: Metadata = { title: "Queue Console" };

export default function QueuePage() {
  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueContent />
    </Suspense>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-6 h-48 bg-muted animate-pulse" />
        <div className="rounded-lg border border-border p-6 h-96 bg-muted animate-pulse" />
      </div>
    </div>
  );
}
