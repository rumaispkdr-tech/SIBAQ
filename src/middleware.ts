import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("sibaq_session")?.value;

  // Static files and internal Next.js requests pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If visiting login while already authenticated, redirect appropriately
  if (pathname === "/login") {
    if (sessionCookie) {
      try {
        const payloadBase64 = sessionCookie.split(".")[1];
        if (payloadBase64) {
          const payload = JSON.parse(
            Buffer.from(payloadBase64, "base64").toString("utf-8")
          );
          if (payload.role === "admin") {
            return NextResponse.redirect(new URL("/admin", request.url));
          }
        }
      } catch {}
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // If visiting protected pages (/ or /admin) without session cookie
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
