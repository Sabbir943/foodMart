/**
 * app/api/auth/login/route.js
 *
 * Login via Better Auth email+password.
 * After Better Auth signs in, we look up our User model to get role/isBlocked.
 */

import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ── Init Better Auth (requires DB) ───────────────────────────────────────
    let auth;
    try {
      auth = await getAuth();
    } catch (authErr) {
      console.error("Auth init error:", authErr.message);
      return NextResponse.json(
        { error: "Database is not reachable. Please ensure MongoDB is running." },
        { status: 503 }
      );
    }

    // ── Check if user is blocked before attempting sign-in ───────────────────
    try {
      const connectDB = (await import("@/lib/db.js")).default;
      await connectDB();
      const User = (await import("@/models/User.js")).default;
      const existing = await User.findOne({
        email: email.toLowerCase().trim(),
      }).lean();
      if (existing?.isBlocked) {
        return NextResponse.json(
          { error: "Your account has been blocked. Please contact support." },
          { status: 403 }
        );
      }
    } catch {
      // DB unavailable — proceed; Better Auth will still validate credentials
    }

    // ── Delegate to Better Auth sign-in ─────────────────────────────────────
    const signInResponse = await auth.api.signInEmail({
      body: { email: email.toLowerCase().trim(), password },
      asResponse: true,
    });

    if (!signInResponse.ok) {
      const data = await signInResponse.json().catch(() => ({}));
      const msg = data.message || data.error || "";
      // Map Better Auth's internal messages to user-friendly ones
      const friendlyMsg =
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("credentials")
          ? "Invalid email or password"
          : msg || "Login failed";
      return NextResponse.json(
        { error: friendlyMsg },
        { status: signInResponse.status }
      );
    }

    const sessionData = await signInResponse.json();

    // ── Look up the user in our model to get role ────────────────────────────
    let role = sessionData.user?.role || "customer";
    let userName = sessionData.user?.name || "";
    let userEmail = sessionData.user?.email || email;

    try {
      const connectDB = (await import("@/lib/db.js")).default;
      await connectDB();
      const User = (await import("@/models/User.js")).default;
      const dbUser = await User.findOne({
        email: userEmail.toLowerCase(),
      }).lean();
      if (dbUser) {
        role = dbUser.role || role;
        userName = dbUser.name || userName;
      }
    } catch {
      // Fallback to session data if DB is not reachable
    }

    // ── Forward Better Auth session cookie ───────────────────────────────────
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: sessionData.user?.id,
        name: userName,
        email: userEmail,
        role,
      },
    });

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
