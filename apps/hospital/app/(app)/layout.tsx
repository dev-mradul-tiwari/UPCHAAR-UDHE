import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LOGIN_PATH } from "@/lib/session";
import { getSessionToken } from "@/lib/session.server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await getSessionToken();
  if (token === null) redirect(LOGIN_PATH);

  return <AppShell>{children}</AppShell>;
}
