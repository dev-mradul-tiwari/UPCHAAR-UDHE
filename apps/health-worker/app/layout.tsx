import type { Metadata } from "next";
import { ThemeScript } from "@upchaar/ui/theme-provider";
import { Providers } from "../components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upchaar Worker",
  description: "Frontline Health Worker Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-background text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
