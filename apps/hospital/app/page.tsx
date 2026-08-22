import { redirect } from "next/navigation";

import { HOME_PATH, LOGIN_PATH } from "@/lib/session";
import { getSessionToken } from "@/lib/session.server";

export default async function RootPage() {
  const token = await getSessionToken();
  redirect(token === null ? LOGIN_PATH : HOME_PATH);
}
