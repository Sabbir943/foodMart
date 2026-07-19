"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

export default function AISearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [parsed, setParsed] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setParsed(null);
      setShowResults(false);
      if (onResults) onResults([], null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/ai/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setParsed(data.parsed || null);
        setShowResults(true);
        if (onResults) onResults(data.results || [], data.parsed);
      }
    } catch {
      setResults([]);
      setParsed(null);
    } finally {
      setLoading(false);
    }
  }, [onResults]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const parsedTags = [];
  if (parsed) {
    if (parsed.cuisine) parsedTags.push(parsed.cuisine);
    if (parsed.priceMax) parsedTags.push(`Under ৳${parsed.priceMax}`);
    if (parsed.priceMin) parsedTags.push(`Over ৳${parsed.priceMin}`);
    if (parsed.rating) parsedTags.push(`★ ${parsed.rating}+`);
    if (parsed.dietary?.length) parsedTags.push(...parsed.dietary);
    if (parsed.keywords?.length) parsedTags.push(...parsed.keywords);
  }

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-neutral-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder='Try: "spicy chicken under ৳500" or "healthy vegan lunch"'
              value={query}
              onChange={handleInputChange}
              className="w-full rounded-2xl bg-white/10 border border-white/20 pl-11 pr-12 py-3.5 text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 text-sm backdrop-blur-md transition-all"
            />
            {loading && (
              <span className="absolute inset-y-0 right-12 flex items-center">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              </span>
            )}
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); setParsed(null); setShowResults(false); if (onResults) onResults([], null); }}
                className="absolute inset-y-0 right-4 flex items-center text-neutral-400 hover:text-white cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-450 px-6 py-3.5 text-white font-bold text-sm transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            AI Search
          </button>
        </div>
      </form>

      {/* Parsed filter tags */}
      {parsedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">AI understood:</span>
          {parsedTags.map((tag) => (
            <span key={tag} className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-[400px] overflow-y-auto rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl z-50">
          <div className="p-3 border-b border-neutral-800">
            <p className="text-xs text-neutral-400">
              <span className="font-bold text-amber-400">{results.length}</span> dishes found
            </p>
          </div>
          <div className="divide-y divide-neutral-800">
            {results.slice(0, 12).map((dish) => (
              <Link
                key={dish._id}
                href={`/restaurants/${dish.restaurantId}`}
                className="flex items-center gap-3 p-3 hover:bg-neutral-800 transition-colors"
                onClick={() => setShowResults(false)}
              >
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="h-12 w-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{dish.name}</p>
                  <p className="text-xs text-neutral-400">{dish.restaurantName} • ৳{dish.price}</p>
                </div>
                <span className="text-xs font-bold text-amber-400 shrink-0">★ {dish.rating}</span>
              </Link>
            ))}
          </div>
          {results.length > 12 && (
            <div className="p-3 border-t border-neutral-800 text-center">
              <button
                onClick={() => setShowResults(false)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                View all {results.length} results →
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {showResults && results.length === 0 && !loading && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl z-50 p-6 text-center">
          <span className="text-3xl">🔍</span>
          <p className="mt-2 text-sm text-neutral-400">No dishes found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
