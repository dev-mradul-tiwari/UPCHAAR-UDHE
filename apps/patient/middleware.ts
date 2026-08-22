import { NextResponse, type NextRequest } from "next/server";

import { HOME_PATH, LOGIN_PATH, SESSION_COOKIE, SIGNUP_PATH } from "@/lib/session";

const PUBLIC_PATHS = new Set<string>([LOGIN_PATH, SIGNUP_PATH]);

/**
 * Gate every page on the session cookie. `/` resolves to the dashboard when
 * signed in and to the login screen otherwise — there is no marketing page.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = (request.cookies.get(SESSION_COOKIE)?.value ?? "").length > 0;

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? HOME_PATH : LOGIN_PATH, request.url),
    );
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return isAuthenticated
      ? NextResponse.redirect(new URL(HOME_PATH, request.url))
      : NextResponse.next();
  }

  if (!isAuthenticated) {
    const login = new URL(LOGIN_PATH, request.url);
    const target = `${pathname}${search}`;
    if (target !== HOME_PATH) login.searchParams.set("next", target);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
