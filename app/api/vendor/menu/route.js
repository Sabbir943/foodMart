import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import MenuItem from "@/models/MenuItem.js";
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

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id })
      .sort({ category: 1, name: 1 });

    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
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
    const { name, description, price, imageUrl, category, variants, isAvailable } = body;

    // Validation
    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, Price, and Category are required fields" },
        { status: 400 }
      );
    }

    // Format variants if provided
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
