import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/ai.js";

export const dynamic = "force-dynamic";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

function ratingFromName(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return parseFloat((4.0 + ((hash & 0xff) / 255) * 1.0).toFixed(1));
}

function priceFromId(id) {
  const num = parseInt(String(id).replace(/\D/g, ""), 10) || 12345;
  return parseFloat(((num % 20) + 6).toFixed(2));
}

// Parse natural language query into structured filters using AI
async function parseQuery(openai, query) {
  const prompt = `Parse this food search query into structured filters. Return ONLY a JSON object.

Query: "${query}"

Return JSON with these fields (use null for any field not specified):
{
  "cuisine": "string or null (one of: Beef, Breakfast, Chicken, Dessert, Goat, Lamb, Miscellaneous, Pasta, Pork, Seafood, Side, Starter, Vegan, Vegetarian)",
  "priceMax": number or null,
  "priceMin": number or null,
  "rating": number or null (minimum rating 1-5),
  "keywords": ["array", "of", "food", "keywords"],
  "dietary": ["array", "of", "dietary preferences like vegetarian, vegan, healthy"],
  "mood": "string or null (e.g., comfort food, light, healthy, indulgent)"
}

Examples:
- "spicy chicken under $15" → {"cuisine":"Chicken","priceMax":15,"keywords":["spicy"],"dietary":[],"mood":null}
- "healthy vegan lunch" → {"cuisine":null,"priceMax":null,"keywords":[],"dietary":["vegan","healthy"],"mood":"healthy"}
- "best seafood" → {"cuisine":"Seafood","priceMax":null,"keywords":["best"],"dietary":[],"mood":null}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a JSON-only parser. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
}

// Search TheMealDB based on parsed filters
async function searchDishes(parsed) {
  const categories = parsed.cuisine
    ? [parsed.cuisine]
    : ["Chicken", "Seafood", "Pasta", "Beef", "Vegetarian", "Dessert", "Breakfast", "Lamb", "Pork", "Goat"];

  const results = [];

  const searchPromises = categories.map(async (cat) => {
    try {
      const res = await fetch(`${MEALDB}/filter.php?c=${cat}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.meals || []).map((m) => ({
        _id: `mdb_meal_${m.idMeal}`,
        name: m.strMeal,
        category: cat,
        imageUrl: m.strMealThumb,
        price: priceFromId(m.idMeal),
        rating: ratingFromName(m.strMeal),
        restaurantId: `mdb_cat_${cat}`,
        restaurantName: `${cat} Kitchen`,
        isAvailable: true,
      }));
    } catch {
      return [];
    }
  });

  const allMeals = (await Promise.all(searchPromises)).flat();

  // Apply filters
  return allMeals.filter((meal) => {
    // Price filter
    if (parsed.priceMax && meal.price > parsed.priceMax) return false;
    if (parsed.priceMin && meal.price < parsed.priceMin) return false;

    // Rating filter
    if (parsed.rating && meal.rating < parsed.rating) return false;

    // Keyword filter
    if (parsed.keywords?.length > 0) {
      const nameLower = meal.name.toLowerCase();
      const match = parsed.keywords.some((kw) => nameLower.includes(kw.toLowerCase()));
      if (!match) return false;
    }

    // Dietary filter
    if (parsed.dietary?.length > 0) {
      const catLower = meal.category.toLowerCase();
      const dietaryMatch = parsed.dietary.some((d) => catLower.includes(d.toLowerCase()));
      if (!dietaryMatch) return false;
    }

    return true;
  }).slice(0, 20);
}

export async function GET(req) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ results: [], parsed: null });
  }

  try {
    const openai = getOpenAI();
    const parsed = await parseQuery(openai, query);
    const results = await searchDishes(parsed);

    return NextResponse.json({
      parsed,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("AI Search error:", error?.message || error);

    // Fallback: simple text search on TheMealDB
    try {
      const cats = ["Chicken", "Seafood", "Pasta", "Beef", "Dessert", "Vegetarian"];
      const results = [];

      for (const cat of cats) {
        const res = await fetch(`${MEALDB}/filter.php?c=${cat}`);
        if (!res.ok) continue;
        const data = await res.json();
        for (const m of data.meals || []) {
          if (m.strMeal.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              _id: `mdb_meal_${m.idMeal}`,
              name: m.strMeal,
              category: cat,
              imageUrl: m.strMealThumb,
              price: priceFromId(m.idMeal),
              rating: ratingFromName(m.strMeal),
              restaurantId: `mdb_cat_${cat}`,
              restaurantName: `${cat} Kitchen`,
              isAvailable: true,
            });
          }
        }
      }

      return NextResponse.json({
        parsed: { keywords: [query], cuisine: null, priceMax: null, priceMin: null, rating: null, dietary: [], mood: null },
        results: results.slice(0, 20),
        total: results.length,
        fallback: true,
      });
    } catch {
      return NextResponse.json({ results: [], parsed: null, error: "Search failed" }, { status: 500 });
    }
  }
}
