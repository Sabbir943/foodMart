import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import MenuItem from "@/models/MenuItem.js";
import Restaurant from "@/models/Restaurant.js";
import { requireRole } from "@/lib/server-auth.js";
import mongoose from "mongoose";

export async function PUT(req, { params }) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid item ID format" }, { status: 400 });
    }

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const menuItem = await MenuItem.findOne({ _id: id, restaurantId: restaurant._id });
    if (!menuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, price, imageUrl, category, variants, isAvailable } = body;

    if (name !== undefined) menuItem.name = name.trim();
    if (description !== undefined) menuItem.description = description.trim();
    if (price !== undefined) menuItem.price = Number(price);
    if (imageUrl !== undefined) menuItem.imageUrl = imageUrl.trim();
    if (category !== undefined) menuItem.category = category.trim();
    if (isAvailable !== undefined) menuItem.isAvailable = !!isAvailable;

    if (variants !== undefined) {
      menuItem.variants = (variants || []).map((v) => ({
        name: v.name.trim(),
        priceModifier: Number(v.priceModifier) || 0,
        isAvailable: v.isAvailable !== false,
      }));
    }

    await menuItem.save();

    return NextResponse.json({
      message: "Menu item updated successfully",
      menuItem,
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid item ID format" }, { status: 400 });
    }

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const result = await MenuItem.deleteOne({ _id: id, restaurantId: restaurant._id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
