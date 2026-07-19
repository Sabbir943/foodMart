import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/models/Restaurant.js";
import { getMockVendor } from "@/lib/auth-mock.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const vendorUser = await getMockVendor();
    if (!vendorUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await Restaurant.findOne({ ownerId: vendorUser._id });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Error fetching restaurant profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const vendorUser = await getMockVendor();
    if (!vendorUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await Restaurant.findOne({ ownerId: vendorUser._id });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, logoUrl, category, address, operatingHours, isOpen } = body;

    // Optional updates
    if (name !== undefined) restaurant.name = name.trim();
    if (description !== undefined) restaurant.description = description.trim();
    if (logoUrl !== undefined) restaurant.logoUrl = logoUrl.trim();
    if (category !== undefined) restaurant.category = category.trim();
    if (isOpen !== undefined) restaurant.isOpen = !!isOpen;

    if (address !== undefined) {
      restaurant.address = {
        street: address.street?.trim() || "",
        city: address.city?.trim() || "",
        district: address.district?.trim() || "",
        postalCode: address.postalCode?.trim() || "",
      };
    }

    if (operatingHours !== undefined) {
      restaurant.operatingHours = (operatingHours || []).map((oh) => ({
        day: oh.day,
        open: oh.open || "09:00",
        close: oh.close || "22:00",
        isClosed: !!oh.isClosed,
      }));
    }

    await restaurant.save();

    return NextResponse.json({
      message: "Restaurant profile updated successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Error updating restaurant profile:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant profile" },
      { status: 500 }
    );
  }
}
