import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Restaurant = (await import("@/models/Restaurant.js")).default;
    await connectDB();

    const restaurant = await Restaurant.findOne({ ownerId: user._id }).lean();
    if (!restaurant) {
      return NextResponse.json({ restaurant: null });
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Error fetching restaurant profile:", error);
    return NextResponse.json({ restaurant: null });
  }
}

export async function POST(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Restaurant = (await import("@/models/Restaurant.js")).default;
    await connectDB();

    // Check if vendor already has a restaurant
    const existing = await Restaurant.findOne({ ownerId: user._id });
    if (existing) {
      return NextResponse.json({ error: "You already have a restaurant. Use PUT to update it." }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, logoUrl, category, address, operatingHours } = body;

    if (!name || !category || !address?.street || !address?.city) {
      return NextResponse.json({ error: "Name, category, and full address are required." }, { status: 400 });
    }

    const restaurant = await Restaurant.create({
      name: name.trim(),
      ownerId: user._id,
      description: description?.trim() || "",
      logoUrl: logoUrl?.trim() || "",
      category: category.trim(),
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        district: address.district?.trim() || "",
        postalCode: address.postalCode?.trim() || "",
        label: address.label?.trim() || "Main",
      },
      location: {
        type: "Point",
        coordinates: [90.4152, 23.7936], // Default: Dhaka
      },
      operatingHours: operatingHours || [
        { day: "mon", open: "09:00", close: "22:00", isClosed: false },
        { day: "tue", open: "09:00", close: "22:00", isClosed: false },
        { day: "wed", open: "09:00", close: "22:00", isClosed: false },
        { day: "thu", open: "09:00", close: "22:00", isClosed: false },
        { day: "fri", open: "09:00", close: "22:00", isClosed: false },
        { day: "sat", open: "09:00", close: "22:00", isClosed: false },
        { day: "sun", open: "10:00", close: "21:00", isClosed: false },
      ],
      isApproved: true,
      isOpen: true,
    });

    return NextResponse.json({ message: "Restaurant created successfully", restaurant }, { status: 201 });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json({ error: "Failed to create restaurant" }, { status: 500 });
  }
}

export async function PUT(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Restaurant = (await import("@/models/Restaurant.js")).default;
    await connectDB();

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found. Create one first." }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, logoUrl, category, address, operatingHours, isOpen } = body;

    if (name !== undefined) restaurant.name = name.trim();
    if (description !== undefined) restaurant.description = description.trim();
    if (logoUrl !== undefined) restaurant.logoUrl = logoUrl.trim();
    if (category !== undefined) restaurant.category = category.trim();
    if (isOpen !== undefined) restaurant.isOpen = !!isOpen;

    if (address !== undefined) {
      restaurant.address = {
        street: address.street?.trim() || restaurant.address.street,
        city: address.city?.trim() || restaurant.address.city,
        district: address.district?.trim() || "",
        postalCode: address.postalCode?.trim() || "",
        label: address.label?.trim() || "Main",
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

    return NextResponse.json({ message: "Restaurant updated successfully", restaurant });
  } catch (error) {
    console.error("Error updating restaurant profile:", error);
    return NextResponse.json({ error: "Failed to update restaurant profile" }, { status: 500 });
  }
}
