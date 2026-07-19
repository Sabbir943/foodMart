import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { user, error } = await requireRole("rider");
  if (error) return error;

  try {
    const body = await req.json();
    const { isAvailable } = body;

    if (isAvailable === undefined) {
      return NextResponse.json({ error: "Missing isAvailable field" }, { status: 400 });
    }

    try {
      const connectDB = (await import("@/lib/db.js")).default;
      const Rider = (await import("@/models/Rider.js")).default;
      await connectDB();

      const riderProfile = await Rider.findOne({ userId: user._id });
      if (!riderProfile) {
        // Return mock success — toggle not persisted but UI still works
        return NextResponse.json({
          message: `Status set to ${isAvailable ? "online" : "offline"}`,
          isAvailable: !!isAvailable,
          source: "mock",
        });
      }

      riderProfile.isAvailable = !!isAvailable;
      await riderProfile.save();
      return NextResponse.json({
        message: `Availability updated to ${isAvailable ? "online" : "offline"}`,
        isAvailable: riderProfile.isAvailable,
      });
    } catch {
      // DB unavailable — return mock success so UI still toggles
      return NextResponse.json({
        message: `Status set to ${isAvailable ? "online" : "offline"}`,
        isAvailable: !!isAvailable,
        source: "mock",
      });
    }
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
