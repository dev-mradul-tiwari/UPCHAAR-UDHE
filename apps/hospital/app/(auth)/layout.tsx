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
          <Brand />
        </Link>
        <ThemeToggle mode="menu" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        Upchaar keeps your health information private and encrypted in transit.
      </footer>
    </div>
  );
}
