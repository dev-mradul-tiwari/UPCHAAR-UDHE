import { cookies } from "next/headers";

import { SESSION_COOKIE } from "./session";

/** The bearer token held in the httpOnly cookie, or `null` when signed out. */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value !== undefined && value.length > 0 ? value : null;
}
