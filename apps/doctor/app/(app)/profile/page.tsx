import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileContent } from "@/components/profile/content";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-6 space-y-4 bg-muted animate-pulse"
          >
            <div className="h-6 w-32 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-10 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
