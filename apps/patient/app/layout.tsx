import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@upchaar/ui/theme-provider";

import { Providers } from "@/components/providers";
import { getSessionToken } from "@/lib/session.server";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Upchaar — Patient",
    template: "%s · Upchaar",
  },
  description:
    "Find care, book appointments and follow your place in the queue, live.",
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
      <body suppressHydrationWarning className="min-h-dvh bg-background text-foreground">
        <Providers token={token}>{children}</Providers>
      </body>
    </html>
  );
}
