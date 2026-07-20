import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/models/Restaurant.js";

export const dynamic = "force-dynamic";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

function ratingFromName(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return parseFloat((4.0 + ((hash & 0xff) / 255) * 1.0).toFixed(1));
}

// All 14 real TheMealDB categories
const MEALDB_CATEGORIES = [
  "Beef","Breakfast","Chicken","Dessert","Goat",
  "Lamb","Miscellaneous","Pasta","Pork","Seafood",
  "Side","Starter","Vegan","Vegetarian",
];

async function fetchMealDBRestaurants(search = "", category = "", minRating = 0) {
  const res = await fetch(`${MEALDB}/categories.php`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("TheMealDB unavailable");
  const data = await res.json();

  let cats = data.categories || [];

  // Filter by name search
  if (search) {
    cats = cats.filter((c) =>
      c.strCategory.toLowerCase().includes(search.toLowerCase()) ||
      (c.strCategoryDescription || "").toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filter by exact category
  if (category) {
    cats = cats.filter((c) => c.strCategory.toLowerCase() === category.toLowerCase());
  }

  const restaurants = cats.map((cat) => ({
    _id: `mdb_cat_${cat.strCategory}`,
    name: `${cat.strCategory} Kitchen`,
    category: cat.strCategory,
    description: cat.strCategoryDescription?.slice(0, 160) || `Authentic ${cat.strCategory} cuisine.`,
    logoUrl: cat.strCategoryThumb,
    rating: ratingFromName(cat.strCategory),
    isOpen: true,
    isApproved: true,
    deliveryTime: "25-40",
    address: { city: "Dhaka", district: "Dhaka", street: "Main Street" },
    source: "themealdb",
  }));

  // Filter by minimum rating
  return minRating > 0 ? restaurants.filter((r) => r.rating >= minRating) : restaurants;
}

export async function GET(req) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const rating = parseFloat(searchParams.get("rating") || "0") || 0;
  const openNow = searchParams.get("openNow") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "9", 10));
  const skip = (page - 1) * limit;

  // ── Try MongoDB first (fail fast if down) ─────────────────────────────
  try {
    await connectDB();
    const filter = { isApproved: true };
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (rating) filter.rating = { $gte: rating };
    if (openNow) filter.isOpen = true;

    const [total, dbRestaurants] = await Promise.all([
      Restaurant.countDocuments(filter),
      Restaurant.find(filter)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    if (total > 0) {
      const seen = new Set();
      const unique = dbRestaurants.filter((r) => {
        const key = (r.name || "").toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return NextResponse.json({
        restaurants: unique,
        pagination: { total: unique.length, page, limit, pages: Math.ceil(unique.length / limit) },
      });
    }
  } catch (err) {
    console.log("MongoDB unavailable, using TheMealDB:", err.message);
  }

  // ── Fallback: TheMealDB ──────────────────────────────────────────────
  try {
    const allRestaurants = await fetchMealDBRestaurants(search, category, rating);
    const total = allRestaurants.length;
    const paginated = allRestaurants.slice(skip, skip + limit);

    return NextResponse.json({
      restaurants: paginated,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      categories: MEALDB_CATEGORIES,
    });
  } catch (err) {
    console.error("TheMealDB also failed:", err.message);
    return NextResponse.json({
      restaurants: [],
      pagination: { total: 0, page: 1, limit, pages: 0 },
    });
  }
}
