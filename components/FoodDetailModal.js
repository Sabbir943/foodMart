"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";

export default function FoodDetailModal({ item, onClose }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    if (!item?._id) return;
    setLoading(true);
    setQty(1);
    setSelectedVariant(null);
    fetch(`/api/menu-items/${item._id}`)
      .then((r) => (r.ok ? r.json() : { menuItem: item }))
      .then((data) => {
        setDetails(data.menuItem || item);
        if (data.restaurant) setRestaurantName(data.restaurant.name);
      })
      .catch(() => setDetails(item))
      .finally(() => setLoading(false));
  }, [item?._id]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!item) return null;

  const data = details || item;
  const variants = data.variants || [];
  const basePrice = data.price || 0;
  const variantPrice = selectedVariant?.priceModifier || 0;
  const unitPrice = basePrice + variantPrice;
  const total = unitPrice * qty;

  const handleAdd = () => {
    const result = addToCart(
      {
        menuItemId: data._id,
        name: data.name,
        price: unitPrice,
        qty,
        variant: selectedVariant?.name || "",
        imageUrl: data.imageUrl,
      },
      data.restaurantId,
      restaurantName || "Restaurant"
    );

    if (result.success) {
      toast.success(`${data.name} added to cart!`);
      onClose();
    } else if (result.conflict) {
      toast.error("Your cart has items from another restaurant. Clear it first to add this item.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
              <p className="text-sm text-neutral-500">Loading details…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Image */}
            <div className="relative h-56 overflow-hidden rounded-t-3xl">
              <img
                src={data.imageUrl}
                alt={data.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {data.category && (
                <span className="absolute top-4 left-4 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/20">
                  {data.category}
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Name & Price */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-black">{data.name}</h2>
                  {data.description && (
                    <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{data.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-xl font-black text-amber-600">৳{unitPrice.toFixed(0)}</span>
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Choose Variant</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedVariant(null)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
                        !selectedVariant
                          ? "bg-black text-white border-black"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-amber-400"
                      }`}
                    >
                      Regular — ৳{basePrice}
                    </button>
                    {variants.filter((v) => v.isAvailable !== false).map((v) => (
                      <button
                        key={v.name}
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
                          selectedVariant?.name === v.name
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-700 border-neutral-200 hover:border-amber-400"
                        }`}
                      >
                        {v.name} — ৳{basePrice + v.priceModifier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Quantity</p>
                <div className="inline-flex items-center rounded-xl border border-neutral-200 overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-10 w-10 items-center justify-center text-lg font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="flex h-10 w-12 items-center justify-center text-sm font-bold text-black border-x border-neutral-200">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="flex h-10 w-10 items-center justify-center text-lg font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAdd}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-3.5 text-white font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] cursor-pointer"
              >
                Add to Cart — ৳{total.toFixed(0)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
