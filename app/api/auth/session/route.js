/**
 * app/api/auth/session/route.js
 *
 * Returns the current session user using Better Auth.
 * Falls back to our User model to get role, isBlocked, addresses.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth.js";
import connectDB from "@/lib/db.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const auth = await getAuth();
    const headersList = await headers();

    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

    // Look up the full user in our model (for role, isBlocked, addresses)
    try {
      const User = (await import("@/models/User.js")).default;
      const dbUser = await User.findOne({
        email: session.user.email.toLowerCase(),
      })
        .select("-passwordHash")
        .lean();

      if (dbUser) {
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

    // Return from Better Auth session data
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
