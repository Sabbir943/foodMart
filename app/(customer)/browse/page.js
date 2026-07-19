"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@heroui/react";

const MEAL_CATEGORIES = [
  { name: "Chicken", emoji: "🍗" },
  { name: "Beef", emoji: "🥩" },
  { name: "Seafood", emoji: "🦐" },
  { name: "Dessert", emoji: "🍰" },
  { name: "Pasta", emoji: "🍝" },
  { name: "Vegetarian", emoji: "🥗" },
  { name: "Breakfast", emoji: "🍳" },
  { name: "Side", emoji: "🍟" },
  { name: "Goat", emoji: "🐐" },
  { name: "Lamb", emoji: "🍖" },
  { name: "Miscellaneous", emoji: "🍱" },
  { name: "Pork", emoji: "🥓" },
  { name: "Starter", emoji: "🥙" },
  { name: "Vegan", emoji: "🌿" },
];

function BrowseFoodContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMeals = async (cat, q) => {
    if (!cat) {
      setMeals([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/meals?type=category&name=${encodeURIComponent(cat)}`);
      if (res.ok) {
        const data = await res.json();
        let items = data.menuItems || [];
        if (q) items = items.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
        setMeals(items);
      }
    } catch {
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) fetchMeals(category, search);
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (category) fetchMeals(category, search);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-14 px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Explore Our Menu</p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Browse Food</h1>
        <p className="mt-3 text-neutral-400 text-sm max-w-lg mx-auto">
          Discover thousands of dishes across every cuisine. Pick a category to get started.
        </p>
        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-md flex gap-2">
          <input
            type="text"
            placeholder="Search within a category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-neutral-400 focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-10">
          {MEAL_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setCategory(cat.name);
                setSearch("");
                router.push(`/browse?category=${cat.name}`);
              }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                category === cat.name
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-amber-400 hover:text-black"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {!category ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200">
            <span className="text-5xl">🍽️</span>
            <h3 className="mt-4 text-lg font-bold text-black">Pick a Category</h3>
            <p className="mt-1 text-sm text-neutral-500">Choose a cuisine category above to browse dishes.</p>
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 p-4 animate-pulse">
                <div className="h-44 rounded-xl bg-neutral-200 mb-3" />
                <div className="h-5 w-3/4 rounded bg-neutral-200 mb-2" />
                <div className="h-4 w-1/2 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200">
            <span className="text-5xl">😔</span>
            <h3 className="mt-4 text-lg font-bold text-black">No dishes found</h3>
            <p className="mt-1 text-sm text-neutral-500">Try a different search term or category.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-6">{meals.length} dishes in <strong>{category}</strong></p>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {meals.map((meal) => (
                <Card
                  key={meal._id}
                  className="rounded-2xl border border-neutral-100 overflow-hidden shadow-soft group hover:-translate-y-1 hover:shadow-soft-lg transition-all duration-300"
                >
                  <div className="relative h-44 bg-neutral-100 overflow-hidden">
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <span className="text-white text-xs font-bold">৳ {meal.price}</span>
                    </div>
                  </div>
                  <Card.Header className="px-4 py-3">
                    <Card.Title className="text-sm font-bold text-black line-clamp-1">{meal.name}</Card.Title>
                    <Card.Description className="text-xs text-neutral-500 mt-0.5">{meal.category}</Card.Description>
                  </Card.Header>
                  <Card.Footer className="px-4 pb-4 pt-0">
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-black text-white hover:bg-neutral-800 font-bold text-xs"
                      as={Link}
                      href={`/restaurants/${meal.restaurantId}`}
                    >
                      Order Now
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BrowseFoodPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    }>
      <BrowseFoodContent />
    </Suspense>
  );
}
