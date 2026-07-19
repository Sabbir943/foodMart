/**
 * app/api/auth/session/route.js
 *
 * Returns the current session user using Better Auth.
 * Falls back to our User model to get role, isBlocked, addresses.
 * Better Auth session is always checked first; DB lookup is a soft enhancement.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ── Get Better Auth session ────────────────────────────────────────────
    let auth;
    try {
      auth = await getAuth();
    } catch {
      // DB not reachable — no session possible
      return NextResponse.json({ user: null });
    }

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

    // ── Enrich with our User model (role, isBlocked, addresses) ─────────────
    try {
      const connectDB = (await import("@/lib/db.js")).default;
      await connectDB();
      const User = (await import("@/models/User.js")).default;

      const dbUser = await User.findOne({
        email: session.user.email.toLowerCase(),
      })
        .select("-passwordHash")
        .lean();

      if (dbUser) {
        // Blocked users get treated as logged out
        if (dbUser.isBlocked) return NextResponse.json({ user: null });

        return NextResponse.json({
          user: {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone || "",
            role: dbUser.role || "customer",
            addresses: dbUser.addresses || [],
          },
        });
      }
    } catch {
      // DB unavailable — fall through to session data
    }

    // ── Fallback: return from Better Auth session data ───────────────────────
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: "",
        role: session.user.role || "customer",
        addresses: [],
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
