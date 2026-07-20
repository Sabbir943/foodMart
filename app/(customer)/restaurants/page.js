"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AISearchBar from "@/components/AISearchBar";

// All 14 TheMealDB categories (matches backend)
const CATEGORIES = [
  "Beef", "Breakfast", "Chicken", "Dessert", "Goat",
  "Lamb", "Miscellaneous", "Pasta", "Pork", "Seafood",
  "Side", "Starter", "Vegan", "Vegetarian",
];

const RATINGS = [
  { label: "Any Rating", value: "" },
  { label: "★ 4.5 & Above", value: "4.5" },
  { label: "★ 4.0 & Above", value: "4.0" },
  { label: "★ 3.5 & Above", value: "3.5" },
];

const PER_PAGE = 9;

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-soft animate-pulse">
      <div className="h-44 bg-neutral-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-neutral-200" />
        <div className="h-4 w-1/2 rounded-lg bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-200" />
        <div className="h-3 w-2/3 rounded bg-neutral-200" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 w-20 rounded-full bg-neutral-200" />
          <div className="h-8 w-24 rounded-xl bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

// ── Restaurant card ──────────────────────────────────────────────────────────
function RestaurantCard({ rest }) {
  const rating = typeof rest.rating === "number" ? rest.rating : parseFloat(rest.rating) || 0;

  return (
    <Link
      href={`/restaurants/${rest._id}`}
      className="group rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden bg-neutral-100 shrink-0">
        <img
          src={
            rest.logoUrl ||
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&fit=crop"
          }
          alt={rest.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
        />
        {/* Rating badge */}
        <div className="absolute top-3 right-3 rounded-full bg-black/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm flex items-center gap-1">
          ★ {rating.toFixed(1)}
        </div>
        {/* Open/closed badge */}
        <div
          className={`absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            rest.isOpen
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {rest.isOpen ? "Open Now" : "Closed"}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex-1">
          <h3 className="text-base font-black text-black leading-tight line-clamp-1">
            {rest.name}
          </h3>
          <p className="mt-1 text-xs text-neutral-500 font-medium flex items-center gap-1">
            <span>{rest.category}</span>
            <span className="text-neutral-300">•</span>
            <span>⏱ {rest.deliveryTime || "30-45"} min</span>
          </p>
          <p className="mt-2.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
            {rest.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
          <span className="text-xs text-neutral-400">
            📍 {rest.address?.city || "Dhaka"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-black text-white px-4 py-1.5 text-xs font-bold group-hover:bg-amber-500 transition-colors duration-300">
            View Menu →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      arr.push(i);
    }
    // Add first/last if not included
    if (arr[0] > 1) { arr.unshift("..."); arr.unshift(1); }
    if (arr[arr.length - 1] < pages) { arr.push("..."); arr.push(pages); }
    return arr;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        ← Prev
      </button>

      {getPages().map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-neutral-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-xl w-10 h-10 text-sm font-bold transition-all cursor-pointer ${
              p === page
                ? "bg-black text-white shadow-sm"
                : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        Next →
      </button>
    </div>
  );
}

// ── Main content ─────────────────────────────────────────────────────────────
function RestaurantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read all filter state from URL (single source of truth)
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlRating = searchParams.get("rating") || "";
  const urlOpenNow = searchParams.get("openNow") === "true";
  const urlPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  // Local search input state (debounced before pushing to URL)
  const [searchInput, setSearchInput] = useState(urlSearch);

  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiResults, setAiResults] = useState(null);

  // Sync local search input when URL changes externally
  useEffect(() => { setSearchInput(urlSearch); }, [urlSearch]);

  // ── Debounce search: wait 450ms before pushing to URL ────────────────────
  const debounceRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushUrl({ search: val, page: "1" });
    }, 450);
  };

  // ── Push filter changes to URL ────────────────────────────────────────────
  const pushUrl = useCallback((overrides = {}) => {
    const p = new URLSearchParams();
    const merged = {
      search: urlSearch,
      category: urlCategory,
      rating: urlRating,
      openNow: urlOpenNow ? "true" : "",
      page: String(urlPage),
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    router.push(`/restaurants?${p.toString()}`, { scroll: false });
  }, [urlSearch, urlCategory, urlRating, urlOpenNow, urlPage, router]);

  // ── Fetch restaurants whenever URL params change (skip if AI results active) ──
  useEffect(() => {
    if (aiResults) return; // Skip fetch when AI results are showing
    let cancelled = false;
    setLoading(true);
    setError("");

    const q = new URLSearchParams();
    if (urlSearch) q.set("search", urlSearch);
    if (urlCategory) q.set("category", urlCategory);
    if (urlRating) q.set("rating", urlRating);
    if (urlOpenNow) q.set("openNow", "true");
    q.set("page", String(urlPage));
    q.set("limit", String(PER_PAGE));

    fetch(`/api/restaurants?${q}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const raw = data.restaurants || [];
        const seen = new Set();
        const unique = [];
        for (const r of raw) {
          const key = (r.name || "").toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(r);
          }
        }
        setRestaurants(unique);
        setPagination(
          data.pagination || { total: 0, page: urlPage, pages: 0 }
        );
      })
      .catch((err) => {
        if (!cancelled) setError("Failed to load restaurants. Please try again.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [urlSearch, urlCategory, urlRating, urlOpenNow, urlPage, aiResults]);

  const clearFilters = () => { router.push("/restaurants"); setSearchInput(""); setAiResults(null); };

  const hasActiveFilters = urlSearch || urlCategory || urlRating || urlOpenNow;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-14 px-4">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">
            Explore &amp; Order
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Discover Restaurants
          </h1>
          <p className="mt-2 text-neutral-400 text-sm max-w-lg">
            Browse through fresh menus and order from the best local kitchens.
          </p>

          {/* ── Top Search Bar (AI-powered) ─────────────────────────────── */}
          <div className="mt-8 max-w-2xl">
            <AISearchBar onResults={(results, parsed) => {
              if (results.length > 0) {
                setAiResults(results);
                setRestaurants(results.map((r) => ({
                  ...r,
                  description: `AI found: ${r.name} at ${r.restaurantName}`,
                  logoUrl: r.imageUrl,
                  isOpen: true,
                  isApproved: true,
                  deliveryTime: "25-40",
                  address: { city: "Dhaka", district: "Dhaka", street: "Main Street" },
                })));
                setPagination({ total: results.length, page: 1, pages: 1 });
              } else if (!parsed) {
                setAiResults(null);
              }
            }} />
            {aiResults && (
              <button
                onClick={() => {
                  setAiResults(null);
                  pushUrl({});
                }}
                className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                ← Back to all restaurants
              </button>
            )}
          </div>

          {/* Fallback search (kept for traditional filtering) */}
          {!aiResults && (
            <div className="mt-4 flex max-w-xl">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-4 flex items-center text-neutral-400 pointer-events-none">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </span>
                <input
                  id="restaurant-search"
                  type="text"
                  placeholder="Search restaurant name or cuisine…"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-2xl bg-white/10 border border-white/20 pl-11 pr-4 py-3.5 text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 text-sm backdrop-blur-md transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute inset-y-0 right-4 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Horizontal Filter Bar ──────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-neutral-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 py-3 overflow-x-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                Cuisine
              </label>
              <select
                id="filter-category"
                value={urlCategory}
                onChange={(e) => pushUrl({ category: e.target.value, page: "1" })}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-neutral-200 shrink-0 hidden sm:block" />

            {/* Rating Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                Rating
              </label>
              <select
                id="filter-rating"
                value={urlRating}
                onChange={(e) => pushUrl({ rating: e.target.value, page: "1" })}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-neutral-200 shrink-0 hidden sm:block" />

            {/* Open Now Toggle */}
            <label className="flex items-center gap-2 cursor-pointer shrink-0 select-none">
              <div
                id="filter-open-now"
                onClick={() => pushUrl({ openNow: urlOpenNow ? "" : "true", page: "1" })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                  urlOpenNow ? "bg-amber-500" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    urlOpenNow ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap">Open Now</span>
            </label>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <>
                <div className="h-6 w-px bg-neutral-200 shrink-0 hidden sm:block" />
                <button
                  id="clear-filters-btn"
                  onClick={clearFilters}
                  className="text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ✕ Clear All
                </button>
              </>
            )}

            {/* Result count (right-aligned on large screens) */}
            <div className="ml-auto text-xs text-neutral-400 font-medium shrink-0 hidden md:block">
              {loading ? "Loading…" : `${pagination.total} result${pagination.total !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results Grid ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {urlSearch && (
              <FilterPill label={`"${urlSearch}"`} onRemove={() => { setSearchInput(""); pushUrl({ search: "", page: "1" }); }} />
            )}
            {urlCategory && (
              <FilterPill label={urlCategory} onRemove={() => pushUrl({ category: "", page: "1" })} />
            )}
            {urlRating && (
              <FilterPill label={`★ ${urlRating}+`} onRemove={() => pushUrl({ rating: "", page: "1" })} />
            )}
            {urlOpenNow && (
              <FilterPill label="Open Now" onRemove={() => pushUrl({ openNow: "", page: "1" })} />
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 mb-6">
            {error}
            <button
              onClick={() => pushUrl({})}
              className="ml-2 underline font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-neutral-200 bg-white text-center">
            <span className="text-6xl mb-4">🍽️</span>
            <h3 className="text-xl font-extrabold text-black">No Restaurants Found</h3>
            <p className="mt-2 text-sm text-neutral-500 max-w-sm">
              We couldn't find any restaurants matching your filters. Try clearing some filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 rounded-2xl bg-black text-white hover:bg-neutral-800 px-8 py-3 text-sm font-bold transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Restaurant cards */}
        {!loading && !error && restaurants.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((rest) => (
                <RestaurantCard key={rest._id} rest={rest} />
              ))}
            </div>

            {/* Pagination (hidden for AI results) */}
            {!aiResults && (
              <Pagination
                page={urlPage}
                pages={pagination.pages}
                onPageChange={(p) => {
                  pushUrl({ page: String(p) });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {/* Summary */}
            <p className="text-center text-xs text-neutral-400 mt-6">
              {aiResults
                ? `AI found ${restaurants.length} dishes matching your search`
                : `Showing ${(urlPage - 1) * PER_PAGE + 1}–${Math.min(urlPage * PER_PAGE, pagination.total)} of ${pagination.total} restaurants`
              }
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Small filter pill component ──────────────────────────────────────────────
function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full hover:bg-amber-200 p-0.5 transition-colors cursor-pointer leading-none"
      >
        ×
      </button>
    </span>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
            <p className="text-sm font-semibold text-neutral-500">Loading restaurants…</p>
          </div>
        </div>
      }
    >
      <RestaurantsContent />
    </Suspense>
  );
}
