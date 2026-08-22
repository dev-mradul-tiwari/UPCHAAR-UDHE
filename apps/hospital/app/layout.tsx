import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@upchaar/ui/theme-provider";

import { Providers } from "@/components/providers";
import { getSessionToken } from "@/lib/session.server";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Upchaar — Hospital",
    template: "%s · Upchaar",
  },
  description: "Hospital admin dashboard for appointments, departments, and inventory.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        <Providers token={token}>{children}</Providers>
      </body>
    </html>
  );
}
