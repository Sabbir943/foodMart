import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import MenuItem from "@/models/MenuItem.js";
import mongoose from "mongoose";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

function priceFromId(id) {
  const num = parseInt(String(id).replace(/\D/g, ""), 10) || 12345;
  return parseFloat(((num % 20) + 6).toFixed(2));
}

async function fetchMealDBMenuItems(categoryName, restaurantId) {
  const res = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(categoryName)}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.meals || []).slice(0, 20).map((meal) => ({
    _id: `mdb_meal_${meal.idMeal}`,
    restaurantId,
    name: meal.strMeal,
    category: categoryName,
    price: priceFromId(meal.idMeal),
    imageUrl: meal.strMealThumb,
    isAvailable: true,
    description: `Freshly prepared ${meal.strMeal}. A classic ${categoryName} favourite.`,
    variants: [],
    source: "themealdb",
  }));
}

export async function GET(req, { params }) {
  const { id } = await params;

  // ── TheMealDB virtual restaurant ──────────────────────────────────────
  if (id.startsWith("mdb_cat_")) {
    try {
      const categoryName = id.replace("mdb_cat_", "");
      const menuItems = await fetchMealDBMenuItems(categoryName, id);
      return NextResponse.json({ menuItems });
    } catch (err) {
      console.error("TheMealDB menu error:", err.message);
      return NextResponse.json({ menuItems: [] });
    }
  }

  // ── MongoDB restaurant ─────────────────────────────────────────────────
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid restaurant ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const menuItems = await MenuItem.find({ restaurantId: id, isAvailable: true })
      .sort({ category: 1, name: 1 })
      .lean();
    return NextResponse.json({ menuItems });
  } catch (err) {
    console.error("Menu fetch error:", err.message);
    return NextResponse.json({ menuItems: [] });
  }
}
