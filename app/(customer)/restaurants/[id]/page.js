"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { Button, Card } from "@heroui/react";
import toast from "react-hot-toast";

export default function RestaurantDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const { addToCart, restaurantId: cartRestId, restaurantName: cartRestName, clearCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Selection State for Variants
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Cart Conflict Modal State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingItemToAdd, setPendingItemToAdd] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restRes, menuRes] = await Promise.all([
        fetch(`/api/restaurants/${id}`),
        fetch(`/api/restaurants/${id}/menu`),
      ]);

      if (!restRes.ok || !menuRes.ok) {
        throw new Error("Failed to load restaurant details");
      }

      const restData = await restRes.json();
      const menuData = await menuRes.json();

      setRestaurant(restData.restaurant);
      setMenuItems(menuData.menuItems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchData();
    });
    return () => {
      active = false;
    };
  }, [id]);

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleAddToCartClick = (item) => {
    if (item.variants && item.variants.length > 0) {
      setSelectedItem(item);
      setSelectedVariant(item.variants[0]);
      setSelectedQty(1);
      setShowVariantModal(true);
    } else {
      const cartItem = {
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        qty: 1,
        variant: "",
        imageUrl: item.imageUrl,
      };
      executeAddToCart(cartItem);
    }
  };

  const handleConfirmVariantAdd = () => {
    if (!selectedItem || !selectedVariant) return;

    const cartItem = {
      menuItemId: selectedItem._id,
      name: selectedItem.name,
      price: selectedItem.price + (selectedVariant.priceModifier || 0),
      qty: selectedQty,
      variant: selectedVariant.name,
      imageUrl: selectedItem.imageUrl,
    };

    setShowVariantModal(false);
    executeAddToCart(cartItem);
  };

  const executeAddToCart = (cartItem) => {
    const result = addToCart(cartItem, restaurant._id, restaurant.name);
    if (result && result.conflict) {
      setPendingItemToAdd(cartItem);
      setShowConflictModal(true);
    } else {
      toast.success("Added to cart! 🛒");
    }
  };

  const handleResolveConflict = () => {
    clearCart();
    // Re-add after clearing
    const result = addToCart(pendingItemToAdd, restaurant._id, restaurant.name);
    setShowConflictModal(false);
    setPendingItemToAdd(null);
    toast.success("Cart cleared and item added! 🛒");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-48 w-full animate-pulse rounded-2xl bg-neutral-200 mb-8" />
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 w-full animate-pulse rounded bg-neutral-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-red-600">Restaurant Not Found</h2>
        <p className="mt-2 text-neutral-600">The requested restaurant does not exist or is inactive.</p>
        <Button
          variant="primary"
          className="mt-6 rounded-xl bg-black text-white"
          onPress={() => router.push("/restaurants")}
        >
          Browse Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Restaurant Header Banner */}
      <section className="relative bg-neutral-950 py-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={restaurant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&fit=crop"}
            alt={restaurant.name}
            className="h-full w-full object-cover filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-black/30" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
            <img
              src={restaurant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&fit=crop"}
              alt={`${restaurant.name} Logo`}
              className="h-24 w-24 rounded-2xl object-cover border-2 border-white shadow-soft"
            />
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {restaurant.name}
              </h1>
              <p className="text-neutral-300 text-sm">{restaurant.description}</p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs font-semibold">
                <span className="bg-amber-500 text-black px-2.5 py-1 rounded-lg">
                  ★ {restaurant.rating ? restaurant.rating.toFixed(1) : "New"}
                </span>
                <span>{restaurant.category}</span>
                <span>&bull;</span>
                <span className={restaurant.isOpen ? "text-emerald-400" : "text-rose-400"}>
                  {restaurant.isOpen ? "Open Now" : "Closed"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Sections */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Categories Navigation Sidebar */}
          <aside className="lg:col-span-1 hidden lg:block sticky top-24 self-start space-y-2">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 px-3">
              Categories
            </h3>
            {Object.keys(menuByCategory).map((catName) => (
              <a
                key={catName}
                href={`#cat-${catName.replace(/\s+/g, "-")}`}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-black transition-all"
              >
                {catName}
              </a>
            ))}
          </aside>

          {/* Menu Items Area */}
          <div className="lg:col-span-3 space-y-12">
            {Object.keys(menuByCategory).length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl">
                <p className="text-neutral-500 text-sm">No menu items available for this restaurant.</p>
              </div>
            ) : (
              Object.entries(menuByCategory).map(([catName, items]) => (
                <section key={catName} id={`cat-${catName.replace(/\s+/g, "-")}`} className="scroll-mt-24">
                  <h2 className="text-xl font-black text-black tracking-tight mb-6 pb-2 border-b border-neutral-100">
                    {catName}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {items.map((item) => (
                      <Card
                        key={item._id}
                        className="shadow-soft rounded-2xl border border-neutral-100 overflow-hidden flex flex-row p-4 gap-4 items-center hover:shadow-soft-lg hover:border-amber-100 transition-all duration-300"
                      >
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop"}
                          alt={item.name}
                          className="h-20 w-20 rounded-xl object-cover bg-neutral-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-black text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-extrabold text-black text-sm">
                              ${item.price.toFixed(2)}
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-black hover:bg-neutral-800 text-white rounded-xl font-bold px-4 py-1 text-xs cursor-pointer"
                              onPress={() => handleAddToCartClick(item)}
                            >
                              + Add
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HeroUI Variant Modal */}
      {showVariantModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-fade-in border border-neutral-100">
            <h3 className="text-lg font-bold text-black mb-1">{selectedItem.name}</h3>
            <p className="text-xs text-neutral-500 mb-4">Select item options below</p>

            <div className="space-y-4">
              {/* Variants */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Choose Variant
                </label>
                <div className="space-y-2">
                  {selectedItem.variants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
                        selectedVariant?.name === v.name
                          ? "border-amber-500 bg-amber-50/20 text-black"
                          : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span>
                        ${(selectedItem.price + (v.priceModifier || 0)).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center text-lg hover:bg-neutral-50 font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold text-black">{selectedQty}</span>
                  <button
                    onClick={() => setSelectedQty(selectedQty + 1)}
                    className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center text-lg hover:bg-neutral-50 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 text-sm font-semibold">
              <button
                onClick={() => setShowVariantModal(false)}
                className="rounded-xl px-4 py-2 text-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVariantAdd}
                className="rounded-xl bg-black hover:bg-neutral-800 px-6 py-2 text-white transition-colors cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Conflict Modal */}
      {showConflictModal && pendingItemToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 animate-fade-in">
            <h3 className="text-lg font-bold text-black mb-2">Replace Cart Items?</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Your cart contains items from <strong className="text-neutral-900">{cartRestName}</strong>.
              Would you like to clear it and add this item from <strong className="text-neutral-900">{restaurant.name}</strong> instead?
            </p>

            <div className="mt-6 flex justify-end gap-2 text-sm font-semibold">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingItemToAdd(null);
                }}
                className="rounded-xl px-4 py-2 text-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveConflict}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-white transition-colors cursor-pointer"
              >
                Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
