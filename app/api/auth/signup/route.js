/**
 * app/api/auth/signup/route.js
 *
 * Custom signup route that:
 * 1. Validates input
 * 2. Checks for existing email in our User model (soft — skipped if DB is down)
 * 3. Creates a user via Better Auth (handles password hashing + session cookie)
 * 4. Creates our custom User model entry with role, addresses, etc.
 * 5. Creates role-specific profiles (Restaurant for vendors, Rider for riders)
 */

import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      restaurantName,
      restaurantAddress,
      restaurantCategory,
      restaurantImageUrl,
      vehicleType,
    } = body;

    // ── Validation ──────────────────────────────────────────────────────────
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

    // ── Check duplicate email (soft — won't crash if DB is unavailable) ────
    try {
      const connectDB = (await import("@/lib/db.js")).default;
      await connectDB();
      const User = (await import("@/models/User.js")).default;
      const existing = await User.findOne({ email: emailLower }).lean();
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
    } catch {
      // DB unavailable — Better Auth will catch duplicates on its side
    }

    // ── Sign up via Better Auth ──────────────────────────────────────────────
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
      const msg = data.message || data.error || "Signup failed";
      // Better Auth returns "User already exists" — make it friendlier
      const friendlyMsg = msg.toLowerCase().includes("already")
        ? "An account with this email already exists"
        : msg;
      return NextResponse.json(
        { error: friendlyMsg },
        { status: signUpResponse.status }
      );
    }

    const sessionData = await signUpResponse.json();
    const betterAuthUserId = sessionData.user?.id;

    // ── Create our custom User model + role-specific profile ────────────────
    let dbUserId = null;
    try {
      const connectDB = (await import("@/lib/db.js")).default;
      await connectDB();
      const { hashPassword } = await import("@/lib/auth.js");
      const User = (await import("@/models/User.js")).default;

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
        const existingRestaurant = await Restaurant.findOne({
          ownerId: dbUser._id,
        });
        if (!existingRestaurant) {
          await Restaurant.create({
            name: restaurantName || `${name.trim()}'s Kitchen`,
            ownerId: dbUser._id,
            description: "Freshly prepared meals.",
            logoUrl: restaurantImageUrl || "",
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
            currentLocation: {
              type: "Point",
              coordinates: [90.4125, 23.8103],
            },
            rating: 5.0,
          });
        }
      }
    } catch (dbErr) {
      console.error("Custom user model creation error:", dbErr.message);
      // Better Auth user was already created — continue anyway
    }

    // ── Return success with session cookies ──────────────────────────────────
    const response = NextResponse.json({
      message: "Account created successfully",
      user: {
        id: dbUserId || betterAuthUserId,
        name: name.trim(),
        email: emailLower,
        role: userRole,
      },
    });

    // Forward Better Auth session cookie to the client
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
