"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const STATUS_CONFIG = {
  placed:          { label: "Placed",           color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",    border: "border-l-blue-500" },
  confirmed:       { label: "Confirmed",         color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", border: "border-l-indigo-500" },
  preparing:       { label: "Preparing",         color: "bg-amber-100 text-amber-700",  dot: "bg-amber-500",   border: "border-l-amber-500" },
  out_for_delivery:{ label: "Out for Delivery",  color: "bg-orange-100 text-orange-700",dot: "bg-orange-500",  border: "border-l-orange-500" },
  delivered:       { label: "Delivered",         color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  cancelled:       { label: "Cancelled",         color: "bg-red-100 text-red-700",     dot: "bg-red-500",     border: "border-l-red-400" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order }) {
  const restaurant = order.restaurantId;
  const cfg = STATUS_CONFIG[order.status] || {};
  const isActive = ["placed", "confirmed", "preparing", "out_for_delivery"].includes(order.status);

  return (
    <div className={`rounded-2xl border-l-4 border border-neutral-100 bg-white shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden ${cfg.border || "border-l-neutral-200"}`}>
      {/* Card header */}
      <div className="flex items-start justify-between p-5 border-b border-neutral-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
            <img
              src={restaurant?.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80&fit=crop"}
              alt={restaurant?.name || "Restaurant"}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-black text-sm">{restaurant?.name || "Restaurant"}</p>
            <p className="text-xs text-neutral-400">{restaurant?.category}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div className="px-5 py-4">
        <div className="space-y-1 mb-4">
          {(order.items || []).slice(0, 3).map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-neutral-600">
              <span>{item.name || (item.menuItemId?.name) || `Item ${i + 1}`} × {item.qty}</span>
              <span className="font-medium">৳{(item.price * item.qty).toFixed(0)}</span>
            </div>
          ))}
          {order.items?.length > 3 && (
            <p className="text-xs text-neutral-400">+{order.items.length - 3} more items</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Total</p>
            <p className="font-black text-black">৳{Number(order.totalAmount).toFixed(0)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Payment</p>
            <p className="text-xs font-semibold text-neutral-700 capitalize">{order.paymentMethod?.replace("_", " ")}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Date</p>
            <p className="text-xs text-neutral-600">
              {new Date(order.createdAt).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex gap-2">
        {isActive && (
          <span className="flex-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-center text-xs font-bold text-amber-700">
            🚀 In Progress…
          </span>
        )}
        <Link
          href={`/restaurants/${restaurant?._id || "#"}`}
          className="flex-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 px-3 py-2 text-center text-xs font-bold text-neutral-700 transition-colors"
        >
          Reorder
        </Link>
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?returnTo=/orders");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => { if (!cancelled) setOrders(data.orders || []); })
      .catch(() => { if (!cancelled) setError("Could not load orders. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const ACTIVE = ["placed", "confirmed", "preparing", "out_for_delivery"];
  const activeOrders = orders.filter((o) => ACTIVE.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE.includes(o.status));

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">My Account</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Orders</h1>
          <p className="mt-1 text-sm text-neutral-400">Track deliveries and view your order history.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 bg-white animate-pulse overflow-hidden">
                <div className="p-5 border-b border-neutral-50 flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-neutral-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                    <div className="h-3 w-1/2 bg-neutral-200 rounded" />
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="h-3 bg-neutral-200 rounded" />
                  <div className="h-3 bg-neutral-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <span className="text-4xl">😕</span>
            <h3 className="mt-3 font-bold text-red-700">{error}</h3>
            <button
              onClick={() => { setError(""); setLoading(true); fetch("/api/orders").then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => setError("Failed.")).finally(() => setLoading(false)); }}
              className="mt-4 rounded-xl bg-red-600 text-white px-6 py-2 text-sm font-bold cursor-pointer hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-neutral-200 bg-white text-center">
            <span className="text-6xl">🛍️</span>
            <h3 className="mt-5 text-xl font-extrabold text-black">No orders yet</h3>
            <p className="mt-2 text-sm text-neutral-500 max-w-sm">
              You haven&apos;t placed any orders. Find a restaurant and order your first meal!
            </p>
            <Link
              href="/restaurants"
              className="mt-6 inline-block rounded-2xl bg-black text-white hover:bg-neutral-800 px-8 py-3 text-sm font-bold transition-all"
            >
              Browse Restaurants →
            </Link>
          </div>
        )}

        {/* Active orders */}
        {!loading && !error && activeOrders.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-extrabold text-black">Active Orders</h2>
              <span className="rounded-full bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5">{activeOrders.length}</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeOrders.map((order) => <OrderCard key={order._id} order={order} />)}
            </div>
          </section>
        )}

        {/* Past orders */}
        {!loading && !error && pastOrders.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-black mb-5">Order History</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastOrders.map((order) => <OrderCard key={order._id} order={order} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
