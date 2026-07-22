import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We can check for a session token cookie.
  // Note: True authentication check happens client-side in layout wrappers via Firebase SDK
  const sessionToken = request.cookies.get("yumi_session")?.value;
  const isAdminCookie = request.cookies.get("yumi_is_admin")?.value;

  if (pathname.startsWith("/admin")) {
    if (!sessionToken || isAdminCookie !== "true") {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account")) {
    if (!sessionToken) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
