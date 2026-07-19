import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/ai.js";
import { getAuthUser } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

function priceFromId(id) {
  const num = parseInt(String(id).replace(/\D/g, ""), 10) || 12345;
  return parseFloat(((num % 20) + 6).toFixed(2));
}

// Fetch popular dishes from TheMealDB as a catalog for AI to pick from
async function fetchDishCatalog() {
  const categories = ["Chicken", "Seafood", "Pasta", "Dessert", "Beef", "Vegetarian", "Breakfast", "Lamb"];
  const catalog = [];

  const results = await Promise.allSettled(
    categories.map(async (cat) => {
      const res = await fetch(`${MEALDB}/filter.php?c=${cat}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.meals || []).slice(0, 5).map((m) => ({
        id: m.idMeal,
        name: m.strMeal,
        category: cat,
        imageUrl: m.strMealThumb,
        price: priceFromId(m.idMeal),
      }));
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") catalog.push(...r.value);
  }
  return catalog;
}

export async function GET(req) {
  try {
    const openai = getOpenAI();
    const catalog = await fetchDishCatalog();

    // Get user context
    let userContext = "Guest user (no order history)";
    try {
      const user = await getAuthUser();
      if (user) {
        userContext = `Logged-in user: ${user.name}`;
        // Try to fetch user's order history
        try {
          const connectDB = (await import("@/lib/db.js")).default;
          const Order = (await import("@/models/Order.js")).default;
          await connectDB();
          const orders = await Order.find({ customerId: user._id })
            .populate("restaurantId", "name category")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          if (orders.length > 0) {
            const favCategories = {};
            for (const order of orders) {
              const cat = order.restaurantId?.category || "Unknown";
              favCategories[cat] = (favCategories[cat] || 0) + 1;
            }
            const topCategories = Object.entries(favCategories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([c]) => c);
            userContext += `\nOrder history: ${orders.length} orders. Favorite categories: ${topCategories.join(", ")}. Last ordered: ${orders[0]?.restaurantId?.name || "unknown"}.`;
          }
        } catch {
          // MongoDB unavailable — use guest context
        }
      }
    } catch {
      // Ignore
    }

    // Get time context
    const now = new Date();
    const hour = now.getHours();
    let timeContext = "evening";
    if (hour < 11) timeContext = "morning (breakfast time)";
    else if (hour < 14) timeContext = "lunchtime";
    else if (hour < 17) timeContext = "afternoon (snack time)";
    else timeContext = "evening (dinner time)";

    const catalogStr = catalog.map((d) => `${d.name} (${d.category}, ৳${d.price})`).join(", ");

    const prompt = `You are a food recommendation engine for FoodMart.

Context:
- Time: ${timeContext}
- User: ${userContext}
- Available dishes: [${catalogStr}]

Based on the user's preferences and time of day, recommend exactly 6 dishes from the catalog. Consider:
- Time-appropriate meals (breakfast in morning, lighter lunch, dinner options)
- Popular categories the user tends to order
- Variety across different cuisines
- Price diversity

Return ONLY a JSON array of dish names (exactly 6 strings), nothing else. Example: ["Butter Chicken", "Caesar Salad", "Fish and Chips", "Tiramisu", "Beef Stir Fry", "Pancakes"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a JSON-only response system. Return only valid JSON arrays." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    let recommendedNames = [];
    try {
      const raw = completion.choices[0]?.message?.content || "[]";
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = raw.match(/\[[\s\S]*?\]/);
      recommendedNames = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      // Fallback: pick random dishes from catalog
      recommendedNames = catalog.sort(() => Math.random() - 0.5).slice(0, 6).map((d) => d.name);
    }

    // Match recommended names back to catalog
    const recommendations = recommendedNames
      .map((name) => {
        const match = catalog.find((d) => d.name.toLowerCase() === name.toLowerCase());
        if (match) {
          const reasons = {
            morning: "Perfect for breakfast",
            lunchtime: "Great lunch choice",
            "afternoon (snack time)": "Ideal afternoon snack",
            "evening (dinner time)": "Excellent dinner pick",
          };
          return { ...match, reason: reasons[timeContext] || "Recommended for you" };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 6);

    // If we got fewer than 6, fill from catalog
    if (recommendations.length < 6) {
      const existingNames = new Set(recommendations.map((r) => r.name));
      const extras = catalog
        .filter((d) => !existingNames.has(d.name))
        .sort(() => Math.random() - 0.5)
        .slice(0, 6 - recommendations.length)
        .map((d) => ({ ...d, reason: "Popular choice" }));
      recommendations.push(...extras);
    }

    return NextResponse.json({ recommendations: recommendations.slice(0, 6) });
  } catch (error) {
    console.error("AI Recommendations error:", error?.message || error);

    // Fallback: return random dishes from TheMealDB
    try {
      const catalog = await fetchDishCatalog();
      const random = catalog.sort(() => Math.random() - 0.5).slice(0, 6).map((d) => ({
        ...d,
        reason: "Popular choice",
      }));
      return NextResponse.json({ recommendations: random, fallback: true });
    } catch {
      return NextResponse.json({ recommendations: [], error: "Failed to load recommendations" });
    }
  }
}
