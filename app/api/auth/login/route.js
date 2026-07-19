/**
 * app/api/auth/login/route.js
 *
 * Login via Better Auth email+password.
 * After Better Auth signs in, we look up our User model to get role/isBlocked.
 */

import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth.js";
import connectDB from "@/lib/db.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const auth = await getAuth();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user is blocked before attempting sign-in
    try {
      const User = (await import("@/models/User.js")).default;
      const existing = await User.findOne({ email: email.toLowerCase() }).lean();
      if (existing?.isBlocked) {
        return NextResponse.json(
          { error: "Your account is blocked. Please contact support." },
          { status: 403 }
        );
      }
    } catch {
      // DB unavailable — let Better Auth handle it
    }

    // Delegate to Better Auth sign-in
    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!signInResponse.ok) {
      const data = await signInResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || data.error || "Invalid email or password" },
        { status: signInResponse.status }
      );
    }

    const sessionData = await signInResponse.json();

    // Look up the user in our model to get role
    let role = "customer";
    let userName = sessionData.user?.name || "";
    let userEmail = sessionData.user?.email || email;

    try {
      const User = (await import("@/models/User.js")).default;
      const dbUser = await User.findOne({ email: userEmail.toLowerCase() }).lean();
      if (dbUser) {
        role = dbUser.role || "customer";
        userName = dbUser.name || userName;
      }
    } catch {
      // fallback to session data
    }

    // Forward the Set-Cookie headers from Better Auth to our response
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: sessionData.user?.id,
        name: userName,
        email: userEmail,
        role,
      },
    });

    // Copy all cookies from Better Auth response
    const setCookieHeader = signInResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
