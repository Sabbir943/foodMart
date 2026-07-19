/**
 * lib/server-auth.js
 *
 * Server-side auth helper for API routes.
 * Uses Better Auth's session API to validate requests.
 */

import { headers } from "next/headers";
import { getAuth } from "./auth.js";
import connectDB from "./db.js";

/**
 * Returns the authenticated user from the Better Auth session.
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  try {
    await connectDB();
    const auth = await getAuth();
    const headersList = await headers();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) return null;

    // Fetch the full user from our User model to get role, isBlocked, etc.
    try {
      const User = (await import("../models/User.js")).default;
      // Better Auth stores user by its own id — try to find by email
      const user = await User.findOne({ email: session.user.email }).lean();
      if (user && !user.isBlocked) {
        return {
          ...user,
          _id: user._id.toString(),
          id: user._id.toString(),
        };
      }
      // If not found in our User collection, return session user with role
      return {
        id: session.user.id,
        _id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "customer",
        isBlocked: false,
      };
    } catch {
      return {
        id: session.user.id,
        _id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "customer",
        isBlocked: false,
      };
    }
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Returns { user } or a NextResponse error.
 */
export async function requireAuth() {
  const { NextResponse } = await import("next/server");
  const user = await getAuthUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { user };
}

/**
 * Requires a specific role. Returns { user } or a NextResponse error.
 */
export async function requireRole(...roles) {
  const { NextResponse } = await import("next/server");
  const user = await getAuthUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
