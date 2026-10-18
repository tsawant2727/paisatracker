import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

/**
 * Lightweight route guard: redirects signed-out visitors to /login and keeps
 * signed-in users off the login page. This only checks for the presence of the
 * session cookie — the signature is verified server-side in getSessionUser(),
 * so a forged cookie still gets rejected there.
 */
export function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";

  if (!hasSession && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on app routes only. Skip Next internals and any static file (anything
  // with a dot: /sw.js, /icons/*.png, /manifest.webmanifest, /favicon.ico …)
  // so PWA assets stay reachable without a session.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
