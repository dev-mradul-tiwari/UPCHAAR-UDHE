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
    </div>
  );
}
