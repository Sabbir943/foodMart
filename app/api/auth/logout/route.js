/**
 * app/api/auth/logout/route.js
 *
 * Signs out via Better Auth which clears the session cookie.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth.js";
import connectDB from "@/lib/db.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const auth = await getAuth();
    const headersList = await headers();

    // Sign out via Better Auth
    const signOutResponse = await auth.api.signOut({
      headers: headersList,
      asResponse: true,
    });

    const response = NextResponse.json({ message: "Logout successful" });

    // Forward Better Auth's cookie-clearing headers
    const setCookieHeader = signOutResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, return success — the client will clear state
    return NextResponse.json({ message: "Logged out" });
  }
}
