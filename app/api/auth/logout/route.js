/**
 * app/api/auth/logout/route.js
 *
 * Signs out via Better Auth which clears the session cookie.
 * No database connection is needed — logout only invalidates the session token.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await getAuth();
    const headersList = await headers();

    const signOutResponse = await auth.api.signOut({
      headers: headersList,
      asResponse: true,
    });

    const response = NextResponse.json({ message: "Logout successful" });

    // Forward Better Auth's cookie-clearing Set-Cookie headers
    const setCookieHeader = signOutResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, tell the client it's done — it will clear local state
    return NextResponse.json({ message: "Logged out" });
  }
}
