import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import MenuItem from "@/models/MenuItem.js";
import Restaurant from "@/models/Restaurant.js";
import mongoose from "mongoose";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

function priceFromId(id) {
  const num = parseInt(String(id).replace(/\D/g, ""), 10) || 12345;
  return parseFloat(((num % 20) + 6).toFixed(2));
}

export async function GET(req, { params }) {
  const { id } = await params;

  // TheMealDB virtual item
  if (id.startsWith("mdb_meal_")) {
    const mealId = id.replace("mdb_meal_", "");
    try {
      const res = await fetch(`${MEALDB}/lookup.php?i=${mealId}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return NextResponse.json({ error: "Meal not found" }, { status: 404 });
      const data = await res.json();
      const meal = (data.meals || [])[0];
      if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });

      const restaurantId = `mdb_cat_${meal.strCategory}`;
      return NextResponse.json({
        menuItem: {
          _id: id,
          restaurantId,
          name: meal.strMeal,
          category: meal.strCategory || "",
          price: priceFromId(meal.idMeal),
          imageUrl: meal.strMealThumb,
          isAvailable: true,
          description: meal.strInstructions
            ? meal.strInstructions.slice(0, 200) + "…"
            : `Delicious ${meal.strMeal} prepared fresh daily.`,
          variants: [],
          source: "themealdb",
        },
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch meal" }, { status: 500 });
    }
  }

  // MongoDB menu item
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const menuItem = await MenuItem.findById(id).lean();
    if (!menuItem) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    let restaurant = null;
    if (menuItem.restaurantId) {
      restaurant = await Restaurant.findById(menuItem.restaurantId)
        .select("name category logoUrl rating isOpen")
        .lean();
    }

    return NextResponse.json({ menuItem, restaurant });
  } catch (err) {
    console.error("Menu item fetch error:", err.message);
    return NextResponse.json({ error: "Failed to fetch menu item" }, { status: 500 });
  }
}
