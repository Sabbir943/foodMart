"use client";

import { useState, useEffect } from "react";
import FoodCard from "./FoodCard";

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-neutral-800 overflow-hidden animate-pulse">
      <div className="h-40 bg-neutral-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-neutral-700 rounded" />
        <div className="h-3 w-1/2 bg-neutral-700 rounded" />
        <div className="h-8 w-full rounded-xl bg-neutral-700 mt-3" />
      </div>
    </div>
  );
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/ai/recommendations")
      .then((r) => r.ok ? r.json() : { recommendations: [] })
      .then((data) => {
        if (mounted) setRecommendations(data.recommendations || []);
      })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-neutral-900 to-neutral-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Powered by AI</p>
            <h2 className="text-2xl font-black text-white tracking-tight">Recommended for You</h2>
            <p className="mt-1 text-sm text-neutral-400">Personalized picks based on your taste and the time of day.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-neutral-900 to-neutral-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Powered by AI
            </p>
            <h2 className="text-2xl font-black text-white tracking-tight">Recommended for You</h2>
            <p className="mt-1 text-sm text-neutral-400">Personalized picks based on your taste and the time of day.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((dish) => (
            <FoodCard
              key={dish.id || dish._id}
              item={dish}
              theme="dark"
              badge="AI Pick"
              subtitle={dish.reason}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
