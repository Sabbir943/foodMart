import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import Restaurant from "@/models/Restaurant.js";
import { getMockAdmin } from "@/lib/auth-mock.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all users with role 'vendor'
    const vendors = await User.find({ role: "vendor" }).select("-passwordHash");

    // Fetch matching restaurant for each vendor
    const vendorsWithRestaurants = await Promise.all(
      vendors.map(async (vendor) => {
        const restaurant = await Restaurant.findOne({ ownerId: vendor._id });
        return {
          vendor,
          restaurant: restaurant || null,
        };
      })
    );

    return NextResponse.json({ vendors: vendorsWithRestaurants });
  } catch (error) {
    console.error("Admin vendors list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required fields" },
        { status: 400 }
      );
    }

    const vendor = await User.findById(userId);
    if (!vendor || vendor.role !== "vendor") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    let message = "";
    if (action === "approve") {
      // Unblock user and approve restaurant
      vendor.isBlocked = false;
      await vendor.save();
      await Restaurant.findOneAndUpdate(
        { ownerId: vendor._id },
        { isApproved: true }
      );
      message = "Vendor approved successfully";
    } else if (action === "suspend") {
      // Block user and suspend restaurant
      vendor.isBlocked = true;
      await vendor.save();
      await Restaurant.findOneAndUpdate(
        { ownerId: vendor._id },
        { isApproved: false }
      );
      message = "Vendor suspended successfully";
    } else if (action === "unban") {
      // Unblock user and approve restaurant
      vendor.isBlocked = false;
      await vendor.save();
      await Restaurant.findOneAndUpdate(
        { ownerId: vendor._id },
        { isApproved: true }
      );
      message = "Vendor unsuspended successfully";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error("Admin vendor action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action on vendor" },
      { status: 500 }
    );
  }
}
