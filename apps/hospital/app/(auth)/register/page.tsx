import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@upchaar/ui/skeleton";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register hospital" };

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 rounded-xl border border-border bg-card p-8 shadow-soft">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
