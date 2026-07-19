import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import MenuItem from "@/models/MenuItem.js";
import Restaurant from "@/models/Restaurant.js";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    await connectDB();

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      return NextResponse.json({ menuItems: [] });
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id })
      .sort({ category: 1, name: 1 });

    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ menuItems: [] });
  }
}

export async function POST(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    await connectDB();

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found. Create a restaurant first." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description, price, imageUrl, category, variants, isAvailable } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, Price, and Category are required fields" },
        { status: 400 }
      );
    }

    const formattedVariants = (variants || []).map((v) => ({
      name: v.name.trim(),
      priceModifier: Number(v.priceModifier) || 0,
      isAvailable: v.isAvailable !== false,
    }));

    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      name: name.trim(),
      description: description?.trim() || "",
      price: Number(price),
      imageUrl: imageUrl?.trim() || "",
      category: category.trim(),
      variants: formattedVariants,
      isAvailable: isAvailable !== false,
    });

    return NextResponse.json({
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
