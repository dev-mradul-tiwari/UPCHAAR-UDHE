import Link from "next/link";
import { ThemeToggle } from "@upchaar/ui/theme-toggle";

import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Link
          href="/"
          className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
          aria-label="Upchaar home"
        >
          <Brand compact={false} />
        </Link>
        <ThemeToggle mode="menu" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        Upchaar keeps your health information private and encrypted in transit.
      </footer>

      <div className="fixed bottom-4 left-4 z-50 rounded-xl border border-border bg-card p-4 shadow-2xl text-sm">
        <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          Demo Credentials
        </h4>
        <div className="space-y-1 text-muted-foreground">
          <p><span className="font-medium text-foreground">Email:</span> aarti.deshmukh@apollocity.in</p>
          <p><span className="font-medium text-foreground">Password:</span> Doctor123!</p>
        </div>
      </div>
    </div>
  );
}
