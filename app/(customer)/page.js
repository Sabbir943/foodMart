"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AIRecommendations from "@/components/AIRecommendations";
import FoodCard from "@/components/FoodCard";

// ── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Chicken", emoji: "🍗", color: "from-amber-50 to-orange-50 border-orange-100" },
  { name: "Beef", emoji: "🥩", color: "from-red-50 to-rose-50 border-red-100" },
  { name: "Seafood", emoji: "🦐", color: "from-blue-50 to-cyan-50 border-blue-100" },
  { name: "Dessert", emoji: "🍰", color: "from-pink-50 to-fuchsia-50 border-pink-100" },
  { name: "Pasta", emoji: "🍝", color: "from-yellow-50 to-amber-50 border-yellow-100" },
  { name: "Vegetarian", emoji: "🥗", color: "from-green-50 to-emerald-50 border-green-100" },
  { name: "Breakfast", emoji: "🍳", color: "from-orange-50 to-amber-50 border-orange-100" },
  { name: "Side", emoji: "🍟", color: "from-yellow-50 to-orange-50 border-yellow-100" },
];

const HOW_IT_WORKS = [
  { icon: "🔍", n: "01", title: "Find a Restaurant", desc: "Browse by cuisine, rating, or what's open near you right now." },
  { icon: "🍽️", n: "02", title: "Pick Your Dishes", desc: "Explore full menus, customise with variants, and build your order." },
  { icon: "💳", n: "03", title: "Pay Securely", desc: "COD, bKash, Nagad, or card — fully encrypted at checkout." },
  { icon: "🚀", n: "04", title: "Fast Delivery", desc: "A verified rider picks up and delivers hot to your door." },
];

const TESTIMONIALS = [
  { name: "Riya Akter", role: "Student, BUET", avatar: "👩‍🎓", rating: 5, text: "FoodMart saved my lunch break! I ordered, it arrived in 28 minutes. The Seafood Kitchen is insane 🦐" },
  { name: "Taher Mahmud", role: "Software Engineer", avatar: "👨‍💻", rating: 5, text: "The app is incredibly smooth. I love the real-time tracking and the food is always hot and fresh." },
  { name: "Sumaya Islam", role: "Entrepreneur", avatar: "👩‍💼", rating: 5, text: "Ordering for my whole team daily. The vendor dashboard is super clean. Love the quick support too!" },
];

const STATS = [
  { value: "500+", label: "Restaurants" },
  { value: "50K+", label: "Customers" },
  { value: "< 45 min", label: "Avg Delivery" },
  { value: "4.9 ★", label: "App Rating" },
];

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden animate-pulse">
      <div className="h-44 bg-neutral-200" />
      <div className="p-5 space-y-2">
        <div className="h-5 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-1/2 rounded bg-neutral-200" />
        <div className="h-8 w-full rounded-xl bg-neutral-200 mt-4" />
      </div>
    </div>
  );
}

export default function CustomerHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // ── Dynamic 1: Featured Restaurants ──────────────────────────────────────
  const [restaurants, setRestaurants] = useState([]);
  const [restLoading, setRestLoading] = useState(true);

  // ── Dynamic 2: Popular Dishes ─────────────────────────────────────────────
  const [popularDishes, setPopularDishes] = useState([]);
  const [dishLoading, setDishLoading] = useState(true);
  const [dishCategory, setDishCategory] = useState("Chicken");

  // Testimonial auto-scroll
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Fetch featured restaurants (deduplicated by name)
  useEffect(() => {
    let mounted = true;
    fetch("/api/restaurants?limit=20")
      .then((r) => r.ok ? r.json() : { restaurants: [] })
      .then((d) => {
        if (!mounted) return;
        const raw = d.restaurants || [];
        const seen = new Set();
        const unique = [];
        for (const r of raw) {
          const key = (r.name || "").toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(r);
          }
        }
        setRestaurants(unique.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => { if (mounted) setRestLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Fetch popular dishes (re-runs on category change)
  useEffect(() => {
    let mounted = true;
    setDishLoading(true);
    fetch(`/api/meals?type=category&name=${encodeURIComponent(dishCategory)}`)
      .then((r) => r.ok ? r.json() : { menuItems: [] })
      .then((d) => { if (mounted) setPopularDishes((d.menuItems || []).slice(0, 6)); })
      .catch(() => {})
      .finally(() => { if (mounted) setDishLoading(false); });
    return () => { mounted = false; };
  }, [dishCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="bg-white min-h-screen">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HERO BANNER                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-neutral-950 min-h-[640px] flex items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Background image with gradient mask */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&fit=crop&q=80"
            alt="Hero food"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Text and Search */}
            <div className="lg:col-span-7 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-6 shadow-sm backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                🔥 45-min Fresh Delivery Guaranteed
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Satisfy Your Cravings <br />
                With <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">Every Bite</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-neutral-300 max-w-lg leading-relaxed font-light">
                Discover local kitchens, customized dishes, and top-tier cuisines delivered straight to your doorstep. Hot, fresh, and on time.
              </p>

              {/* Search bar with premium glassmorphic styling */}
              <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl bg-white/5 border border-white/10 p-2 rounded-3xl backdrop-blur-md shadow-2xl">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search your favorite meals or restaurants…"
                    className="w-full rounded-2xl bg-transparent border-0 pl-12 pr-4 py-3.5 text-white placeholder-neutral-400 focus:outline-none focus:ring-0 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-450 px-8 py-3.5 text-white font-bold text-sm transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]"
                >
                  Search
                </button>
              </form>

              {/* Quick links */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Popular:</span>
                {["Chicken", "Seafood", "Dessert", "Pasta"].map((cat) => (
                  <Link
                    key={cat}
                    href={`/restaurants?category=${cat}`}
                    className="rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition-all active:scale-[0.97]"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column: Floating Visual Cards */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="relative mx-auto w-[360px] h-[360px] flex items-center justify-center">
                {/* Decorative circle */}
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_60s_linear_infinite]" />
                
                {/* Main Floating Food Card */}
                <div className="absolute z-10 w-72 bg-neutral-900/90 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="relative rounded-2xl overflow-hidden h-40">
                    <img 
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&fit=crop" 
                      alt="Special Pizza" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 right-3 bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Chef's Choice
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Pepperoni Feast</h4>
                      <p className="text-xs text-neutral-400">Extra cheese & basil</p>
                    </div>
                    <span className="text-amber-400 font-extrabold text-sm">৳450</span>
                  </div>
                </div>

                {/* Sub Floating Rating Card */}
                <div className="absolute -bottom-4 -left-4 z-20 bg-neutral-900/90 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-xl flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <h5 className="text-white font-bold text-xs leading-none">4.9 Rating</h5>
                    <p className="text-[10px] text-neutral-400 mt-1">From 5k+ reviews</p>
                  </div>
                </div>

                {/* Sub Floating Time Card */}
                <div className="absolute -top-4 -right-4 z-20 bg-neutral-900/90 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-xl flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h5 className="text-white font-bold text-xs leading-none">Super Fast</h5>
                    <p className="text-[10px] text-neutral-400 mt-1">Under 35 mins avg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="absolute bottom-0 inset-x-0 bg-neutral-900/40 backdrop-blur-md border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col items-center py-4">
                  <span className="text-xl font-black text-amber-400">{s.value}</span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  CATEGORY PILLS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">Browse by Cuisine</h2>
            <p className="mt-1 text-sm text-neutral-500">Pick a category and start exploring.</p>
          </div>
          <Link href="/browse" className="text-sm font-bold text-amber-600 hover:text-amber-500 transition-colors">
            All Categories →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/restaurants?category=${encodeURIComponent(cat.name)}`}
              className={`flex flex-col items-center justify-center rounded-2xl border bg-gradient-to-br p-5 text-center ${cat.color} hover:-translate-y-1.5 hover:shadow-soft-lg transition-all duration-300 group cursor-pointer`}
            >
              <span className="text-4xl transition-transform group-hover:scale-125 duration-300">{cat.emoji}</span>
              <span className="mt-2.5 text-xs font-bold text-neutral-700 group-hover:text-black">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  DYNAMIC 1: FEATURED RESTAURANTS                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-50 border-y border-neutral-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Live Menu</p>
              <h2 className="text-2xl font-black text-black tracking-tight">Featured Restaurants</h2>
              <p className="mt-1 text-sm text-neutral-500">Handpicked premium kitchens delivering near you.</p>
            </div>
            <Link href="/restaurants" className="text-sm font-bold text-amber-600 hover:text-amber-500 transition-colors">
              View All →
            </Link>
          </div>

          {restLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 bg-white">
              <span className="text-4xl">😔</span>
              <p className="mt-4 text-sm text-neutral-500">No restaurants available right now.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((rest) => {
                const rating = typeof rest.rating === "number" ? rest.rating : parseFloat(rest.rating) || 0;
                return (
                  <Link
                    key={rest._id}
                    href={`/restaurants/${rest._id}`}
                    className="group rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-44 overflow-hidden bg-neutral-100 shrink-0">
                      <img
                        src={rest.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&fit=crop"}
                        alt={rest.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 rounded-full bg-black/80 px-2.5 py-0.5 text-xs font-bold text-white">
                        ★ {rating.toFixed(1)}
                      </div>
                      <div className={`absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${rest.isOpen ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                        {rest.isOpen ? "Open" : "Closed"}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="font-black text-black text-base line-clamp-1">{rest.name}</h3>
                      <p className="mt-0.5 text-xs text-neutral-500">{rest.category} • 30–40 min</p>
                      <p className="mt-2 text-xs text-neutral-600 line-clamp-2 leading-relaxed flex-1">{rest.description}</p>
                      <div className="mt-4 flex justify-end">
                        <span className="rounded-xl bg-black text-white group-hover:bg-amber-500 transition-colors px-4 py-1.5 text-xs font-bold">
                          View Menu →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  DYNAMIC 2: POPULAR DISHES (live from TheMealDB)                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Real-time Menu</p>
              <h2 className="text-2xl font-black text-white tracking-tight">Popular Dishes</h2>
              <p className="mt-1 text-sm text-neutral-400">Trending meals our customers love most right now.</p>
            </div>
            {/* Category switcher */}
            <div className="flex flex-wrap gap-2">
              {["Chicken", "Seafood", "Pasta", "Dessert", "Beef"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setDishCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    dishCategory === cat
                      ? "bg-amber-500 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {dishLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-neutral-800 overflow-hidden animate-pulse">
                  <div className="h-44 bg-neutral-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 bg-neutral-700 rounded" />
                    <div className="h-3 w-1/2 bg-neutral-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {popularDishes.map((dish) => (
                <FoodCard key={dish._id} item={dish} theme="dark" />
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href={`/browse?category=${dishCategory}`}
              className="inline-block rounded-2xl border border-amber-500/40 hover:bg-amber-500 hover:border-amber-500 px-8 py-3 text-amber-400 hover:text-white font-bold text-sm transition-all"
            >
              Browse All {dishCategory} Dishes →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  AI RECOMMENDATIONS                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AIRecommendations />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  STATIC: HOW IT WORKS                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Simple & Fast</p>
            <h2 className="text-3xl font-extrabold text-black tracking-tight">How FoodMart Works</h2>
            <p className="mt-3 text-neutral-500 text-sm max-w-md mx-auto">From browse to your doorstep in four easy steps.</p>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-amber-100 via-amber-400 to-amber-100" />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.n} className="relative flex flex-col items-center text-center group">
                  <div className="relative z-10 flex h-[104px] w-[104px] items-center justify-center rounded-full bg-white border-2 border-amber-100 group-hover:border-amber-400 shadow-soft group-hover:shadow-soft-lg transition-all duration-300">
                    <span className="text-4xl">{step.icon}</span>
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-extrabold text-black">{step.title}</h3>
                  <p className="mt-2 text-sm text-neutral-500 max-w-[180px] mx-auto leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/restaurants"
              className="inline-block rounded-2xl bg-black hover:bg-neutral-800 px-10 py-4 text-white font-bold text-sm transition-all hover:-translate-y-0.5"
            >
              Start Ordering →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TESTIMONIALS                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-50 py-20 border-t border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">What Our Customers Say</p>
            <h2 className="text-3xl font-extrabold text-black tracking-tight">Loved by Thousands</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`rounded-2xl border bg-white p-6 shadow-soft transition-all duration-500 ${
                  i === activeTestimonial
                    ? "border-amber-300 shadow-soft-lg scale-105"
                    : "border-neutral-100 scale-100"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="font-bold text-black text-sm">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeTestimonial ? "w-8 bg-amber-500" : "w-2 bg-neutral-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  APP DOWNLOAD BANNER                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Get the <span className="text-amber-400">FoodMart</span> App
              </h2>
              <p className="mt-2 text-neutral-400 text-sm max-w-sm">
                Track orders live, unlock exclusive deals, and reorder favourites with one tap.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#" className="inline-flex items-center gap-3 rounded-2xl bg-white hover:bg-neutral-100 px-5 py-3 transition-all">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <p className="text-[10px] text-neutral-500 font-medium leading-none">Download on the</p>
                    <p className="text-sm font-black text-black leading-tight">App Store</p>
                  </div>
                </a>
                <a href="#" className="inline-flex items-center gap-3 rounded-2xl bg-white hover:bg-neutral-100 px-5 py-3 transition-all">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="text-[10px] text-neutral-500 font-medium leading-none">Get it on</p>
                    <p className="text-sm font-black text-black leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-8 inline-block">
                <span className="text-7xl">📱</span>
                <p className="mt-3 text-xs text-neutral-400 font-medium">Scan to Download</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  WHY US — quick trust signals                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: "🚀", title: "45-min Guarantee", desc: "Your order is delivered hot in 45 minutes or your next delivery is free." },
              { icon: "🍕", title: "500+ Kitchens", desc: "Discover menus from the best local restaurants, bakeries, and home cooks." },
              { icon: "💳", title: "Secure Payments", desc: "Cash, bKash, Nagad, or card — all transactions fully encrypted." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft">
                <span className="text-3xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-black text-sm">{item.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
