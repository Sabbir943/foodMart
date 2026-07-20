"use client";

import { useState } from "react";
import FoodDetailModal from "./FoodDetailModal";

/**
 * Reusable food card component.
 *
 * Props:
 *   item      — { _id, name, price, imageUrl, category, description, variants, restaurantId }
 *   theme     — "dark" (default) | "light"
 *   badge     — optional badge text shown on image (e.g. "AI Pick")
 *   subtitle  — extra line under category (e.g. AI reason)
 *   linkHref  — if provided, clicking the card body (not the button) navigates here
 */
export default function FoodCard({ item, theme = "dark", badge, subtitle, linkHref }) {
  const [showModal, setShowModal] = useState(false);

  const isDark = theme === "dark";

  return (
    <>
      <div
        className={`group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? "bg-neutral-900 border border-neutral-800 hover:border-amber-500/50"
            : "bg-white border border-neutral-100 shadow-soft hover:shadow-soft-lg"
        }`}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <span className={`text-xs font-bold line-clamp-1 flex-1 mr-2 ${isDark ? "text-white" : "text-white"}`}>
              {item.name}
            </span>
            <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
              ৳{item.price}
            </span>
          </div>
          {badge && (
            <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <span className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              {item.category}
              {subtitle && (
                <>
                  <span className="mx-1.5">•</span>
                  {subtitle}
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={`text-xs font-bold transition-colors cursor-pointer ${
              isDark ? "text-amber-400 hover:text-amber-300" : "text-amber-600 hover:text-amber-500"
            }`}
          >
            View Details →
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <FoodDetailModal item={item} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
