/**
 * /api/meals — TheMealDB proxy & data normaliser
 *
 * TheMealDB is 100% free with no API key needed.
 * Base URL: https://www.themealdb.com/api/json/v1/1/
 *
 * Query params:
 *   ?type=categories              → all categories (as "restaurants")
 *   ?type=category&name=Chicken   → meals in a category (as "menu items")
 *   ?type=meal&id=52772           → single meal detail
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

// Deterministic price from meal ID so it doesn't change on re-render
function priceFromId(id) {
  const num = parseInt(id.replace(/\D/g, ""), 10) || 12345;
  return parseFloat(((num % 20) + 6).toFixed(2));
}

// Deterministic rating from name
function ratingFromName(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return parseFloat((4.0 + ((hash & 0xff) / 255) * 1.0).toFixed(1));
}

function categoryToRestaurant(cat) {
  return {
    _id: `mdb_cat_${cat.strCategory}`,
    name: `${cat.strCategory} Kitchen`,
    category: cat.strCategory,
    description: cat.strCategoryDescription?.slice(0, 150) || `Authentic ${cat.strCategory} dishes.`,
    logoUrl: cat.strCategoryThumb,
    rating: ratingFromName(cat.strCategory),
    isOpen: true,
    isApproved: true,
    address: { city: "Dhaka", district: "Dhaka", street: "Main Street" },
    location: { type: "Point", coordinates: [90.4152, 23.7936] },
    source: "themealdb",
  };
}

function mealToMenuItem(meal, restaurantId) {
  return {
    _id: `mdb_meal_${meal.idMeal}`,
    restaurantId,
    name: meal.strMeal,
    category: meal.strCategory || "",
    price: priceFromId(meal.idMeal),
    imageUrl: meal.strMealThumb,
    isAvailable: true,
    description: meal.strInstructions
      ? meal.strInstructions.slice(0, 120) + "…"
      : `Delicious ${meal.strMeal} prepared fresh daily.`,
    variants: [],
    source: "themealdb",
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "categories";
    const name = searchParams.get("name") || "";
    const id = searchParams.get("id") || "";

    if (type === "categories") {
      const res = await fetch(`${MEALDB}/categories.php`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error("TheMealDB unavailable");
      const data = await res.json();
      const restaurants = (data.categories || []).map(categoryToRestaurant);
      return NextResponse.json({ restaurants });
    }

    if (type === "category" && name) {
      const res = await fetch(`${MEALDB}/filter.php?c=${encodeURIComponent(name)}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error("TheMealDB unavailable");
      const data = await res.json();
      const restaurantId = `mdb_cat_${name}`;
      const menuItems = (data.meals || []).slice(0, 20).map((meal) =>
        mealToMenuItem({ ...meal, strCategory: name }, restaurantId)
      );
      return NextResponse.json({ menuItems });
    }

    if (type === "meal" && id) {
      const res = await fetch(`${MEALDB}/lookup.php?i=${id}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error("TheMealDB unavailable");
      const data = await res.json();
      const meal = (data.meals || [])[0];
      if (!meal) {
        return NextResponse.json({ error: "Meal not found" }, { status: 404 });
      }
      const restaurantId = `mdb_cat_${meal.strCategory}`;
      return NextResponse.json({ menuItem: mealToMenuItem(meal, restaurantId) });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("TheMealDB error:", error);
    return NextResponse.json({ error: "Failed to fetch meal data" }, { status: 500 });
  }
}
