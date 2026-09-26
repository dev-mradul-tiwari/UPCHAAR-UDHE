import * as React from "react";
import Link from "next/link";
import { Brand } from "../../components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/20">
      <header className="absolute top-0 w-full p-4 md:p-6 lg:p-8">
        <Link href="/" className="inline-block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
          <Brand />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>

      <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-border bg-card p-4 shadow-2xl text-sm">
        <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
          Demo Credentials
        </h4>
        <div className="space-y-1 text-muted-foreground">
          <p><span className="font-medium text-foreground">Phone:</span> 9876543210</p>
          <p><span className="font-medium text-foreground">Password:</span> Worker123!</p>
        </div>
      </div>
    </div>
  );
}
