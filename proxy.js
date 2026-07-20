import { NextResponse } from "next/server";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isVendorRoute = pathname.startsWith("/vendor");
  const isRiderRoute = pathname.startsWith("/rider");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute || isVendorRoute || isRiderRoute || isDashboardRoute) {
    // Better Auth stores session in "better-auth.session_token" cookie.
    // We only check cookie existence here — actual verification happens
    // server-side in API routes and client-side via useAuth().
    const sessionToken = request.cookies.get("better-auth.session_token")?.value;

    if (!sessionToken) {
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/rider/:path*",
    "/dashboard/:path*",
  ],
};
