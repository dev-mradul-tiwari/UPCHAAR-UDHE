"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  UserPlus
} from "lucide-react";
import { Button } from "@upchaar/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@upchaar/ui/dropdown-menu";
import { Separator } from "@upchaar/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@upchaar/ui/sheet";
import { ThemeToggle } from "@upchaar/ui/theme-toggle";
import { LanguageToggle } from "@upchaar/ui/language-toggle";
import { UserAvatar } from "@upchaar/ui/avatar";
import { cn } from "@upchaar/ui/lib/utils";

import { Brand } from "./brand";
import { CreatePatientDialog } from "./patients/create-patient-dialog";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard aria-hidden />,
      description: "Overview and stats",
    },
    {
      href: "/patients",
      label: "My Patients",
      icon: <Users aria-hidden />,
      description: "Manage assigned patients",
    },
  ];

  return (
    <nav aria-label="Main" className="grid gap-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
              active
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "size-5 shrink-0 transition-transform group-hover:scale-110",
                active ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {item.icon}
            </span>
            <div className="flex flex-col">
              <span className="leading-tight">{item.label}</span>
              <span
                className={cn(
                  "text-[11px] leading-tight font-normal",
                  active ? "text-primary-foreground/80" : "text-muted-foreground/70",
                )}
              >
                {item.description}
              </span>
            </div>
          </Link>
        );
      })}
      
      <CreatePatientDialog triggerNode={
        <button className="group flex w-full text-left items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 text-muted-foreground hover:bg-muted hover:text-foreground">
          <span className="size-5 shrink-0 transition-transform group-hover:scale-110 text-muted-foreground">
            <UserPlus aria-hidden />
          </span>
          <div className="flex flex-col">
            <span className="leading-tight">Register Patient</span>
            <span className="text-[11px] leading-tight font-normal text-muted-foreground/70">
              Assign new patient
            </span>
          </div>
        </button>
      } />
    </nav>
  );
}

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto gap-2 px-2 py-1.5"
          aria-label="Account menu"
        >
          <UserAvatar name="Health Worker" className="size-8" />
          <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
            Health Worker
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="text-sm font-medium text-foreground">
            Health Worker
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            ASHA / ANM
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action="/actions/auth/logout" method="POST">
          <button type="submit" className="w-full text-left">
            <DropdownMenuItem>
              <LogOut aria-hidden className="mr-2" />
              Sign out
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border bg-card px-4 py-6 lg:flex">
        <Link
          href="/"
          className="rounded-xl px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <Brand />
        </Link>
        <Separator />
        <NavLinks />
        <div className="mt-auto rounded-xl bg-primary-subtle px-4 py-3.5">
          <p className="text-sm font-medium text-primary-subtle-foreground">
            Frontline Portal Active
          </p>
          <p className="mt-1 text-xs text-primary-subtle-foreground/80">
            You are assisting patients securely.
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu aria-hidden />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[17rem]">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Brand />
                  </SheetHeader>
                  <NavLinks onNavigate={() => setMenuOpen(false)} />
                </SheetContent>
              </Sheet>
              <Link
                href="/"
                className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 lg:hidden"
              >
                <Brand compact />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle mode="menu" />
              <AccountMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          UpchaarWorker · Aiding rural access to healthcare.
        </footer>
      </div>
    </div>
  );
}
