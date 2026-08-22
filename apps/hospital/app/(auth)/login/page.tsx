import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@upchaar/ui/skeleton";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 rounded-xl border border-border bg-card p-8 shadow-soft">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
