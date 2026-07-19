import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/models/Restaurant.js";
import mongoose from "mongoose";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

function ratingFromName(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return parseFloat((4.0 + ((hash & 0xff) / 255) * 1.0).toFixed(1));
}

async function fetchMealDBRestaurant(categoryName) {
  const res = await fetch(`${MEALDB}/categories.php`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const cat = (data.categories || []).find((c) => c.strCategory === categoryName);
  if (!cat) return null;
  return {
    _id: `mdb_cat_${cat.strCategory}`,
    name: `${cat.strCategory} Kitchen`,
    category: cat.strCategory,
    description: cat.strCategoryDescription?.slice(0, 300) || `Authentic ${cat.strCategory} cuisine.`,
    logoUrl: cat.strCategoryThumb,
    rating: ratingFromName(cat.strCategory),
    isOpen: true,
    isApproved: true,
    address: { street: "48 Food Street", city: "Dhaka", district: "Dhaka", postalCode: "1212" },
    location: { type: "Point", coordinates: [90.4152, 23.7936] },
    operatingHours: { open: "08:00", close: "23:00" },
    source: "themealdb",
  };
}

export async function GET(req, { params }) {
  const { id } = await params;

  // ── TheMealDB virtual restaurant ──────────────────────────────────────
  if (id.startsWith("mdb_cat_")) {
    try {
      const categoryName = id.replace("mdb_cat_", "");
      const restaurant = await fetchMealDBRestaurant(categoryName);
      if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      return NextResponse.json({ restaurant });
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch restaurant" }, { status: 500 });
    }
  }

  // ── MongoDB restaurant ─────────────────────────────────────────────────
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid restaurant ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const restaurant = await Restaurant.findById(id).lean();
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    return NextResponse.json({ restaurant });
  } catch (err) {
    console.error("Restaurant fetch error:", err.message);
    return NextResponse.json({ error: "Failed to fetch restaurant" }, { status: 500 });
  }
}
