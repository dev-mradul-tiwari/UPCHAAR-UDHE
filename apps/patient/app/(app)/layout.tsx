import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LOGIN_PATH } from "@/lib/session";
import { getSessionToken } from "@/lib/session.server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The middleware already gates this, but a server-side check keeps the shell
  // from ever rendering without a session.
  const token = await getSessionToken();
  if (token === null) redirect(LOGIN_PATH);

  return <AppShell>{children}</AppShell>;
}
