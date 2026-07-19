/**
 * app/api/auth/signup/route.js
 *
 * Custom signup route that:
 * 1. Creates a user via Better Auth (handles hashing + session cookie)
 * 2. Also creates our custom User model entry with role, addresses, etc.
 * 3. Creates role-specific profiles (Restaurant for vendors, Rider for riders)
 *
 * Phone number is NOT collected (as per user request).
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
    const {
      name, email, password,
      role,
      restaurantName, restaurantAddress, restaurantCategory,
      vehicleType,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const userRole = role || "customer";

    // ── Check if email already exists in our User model ───────────────────
    try {
      const User = (await import("@/models/User.js")).default;
      const existing = await User.findOne({ email: emailLower }).lean();
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
    } catch {
      // DB unavailable — Better Auth will catch duplicates
    }

    // ── Sign up via Better Auth ───────────────────────────────────────────
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: emailLower,
        password,
        role: userRole,
      },
      asResponse: true,
    });

    if (!signUpResponse.ok) {
      const data = await signUpResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || data.error || "Signup failed" },
        { status: signUpResponse.status }
      );
    }

    const sessionData = await signUpResponse.json();
    const betterAuthUserId = sessionData.user?.id;

    // ── Create our custom User model entry ────────────────────────────────
    let dbUserId = null;
    try {
      const User = (await import("@/models/User.js")).default;
      const { hashPassword } = await import("@/lib/auth.js");
      const passwordHash = await hashPassword(password);

      const dbUser = await User.create({
        name: name.trim(),
        email: emailLower,
        phone: "",
        passwordHash,
        role: userRole,
        isBlocked: false,
        addresses: [],
      });
      dbUserId = dbUser._id.toString();

      // Create role-specific profiles
      if (userRole === "vendor") {
        const Restaurant = (await import("@/models/Restaurant.js")).default;
        const existingRestaurant = await Restaurant.findOne({ ownerId: dbUser._id });
        if (!existingRestaurant) {
          await Restaurant.create({
            name: restaurantName || `${name.trim()}'s Kitchen`,
            ownerId: dbUser._id,
            description: "Freshly prepared meals.",
            category: restaurantCategory || "General",
            address: {
              street: restaurantAddress || "Main Street",
              city: "Dhaka",
              district: "Dhaka",
              postalCode: "1212",
            },
            location: { type: "Point", coordinates: [90.4152, 23.7936] },
            isApproved: true,
            isOpen: true,
            rating: 4.5,
          });
        }
      }

      if (userRole === "rider") {
        const Rider = (await import("@/models/Rider.js")).default;
        const existingRider = await Rider.findOne({ userId: dbUser._id });
        if (!existingRider) {
          await Rider.create({
            userId: dbUser._id,
            vehicleType: vehicleType || "motorcycle",
            isAvailable: true,
            currentLocation: { type: "Point", coordinates: [90.4125, 23.8103] },
            rating: 5.0,
          });
        }
      }
    } catch (dbErr) {
      console.error("Custom user model creation error:", dbErr.message);
      // Better Auth user was already created — continue anyway
    }

    // ── Return success with session cookies ───────────────────────────────
    const response = NextResponse.json({
      message: "Account created successfully",
      user: {
        id: dbUserId || betterAuthUserId,
        name: name.trim(),
        email: emailLower,
        role: userRole,
      },
    });

    // Forward Better Auth cookies (session token)
    const setCookieHeader = signUpResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup. Please try again." },
      { status: 500 }
    );
  }
}
