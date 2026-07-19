"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABELS = {
  placed: { label: "New Order", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  confirmed: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  preparing: { label: "Preparing", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-soft ${color || "border-neutral-100"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-black">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?returnTo=/vendor/dashboard");
    if (!authLoading && user && user.role !== "vendor" && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || (user.role !== "vendor" && user.role !== "admin")) return;

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch("/api/vendor/stats").then((r) => r.json()),
      fetch("/api/vendor/orders").then((r) => r.json()),
    ])
      .then(([statsData, ordersData]) => {
        if (cancelled) return;
        setStats(statsData.stats);
        setRestaurant(statsData.restaurant || null);
        setOrders((ordersData.orders || []).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard data.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Loading vendor dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "vendor" && user.role !== "admin")) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-12 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Vendor Panel</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {restaurant?.name || "Your Kitchen"}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Welcome back, <span className="text-white font-semibold">{user.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/vendor/menu"
              className="rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all"
            >
              🍽️ Manage Menu
            </Link>
            <Link
              href="/vendor/orders"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-bold text-white transition-all"
            >
              📋 All Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="📦" label="Today's Orders" value={stats?.todayOrdersCount ?? "—"} sub="Orders placed today" color="border-l-4 border-l-blue-500 border-neutral-100" />
          <StatCard icon="💰" label="Today's Revenue" value={stats?.todayRevenue != null ? `৳${Number(stats.todayRevenue).toFixed(0)}` : "—"} sub="From delivered orders" color="border-l-4 border-l-emerald-500 border-neutral-100" />
          <StatCard icon="⏳" label="Pending" value={stats?.pendingOrdersCount ?? "—"} sub="Need your attention" color="border-l-4 border-l-amber-500 border-neutral-100" />
          <StatCard icon="✅" label="Ready for Pickup" value={stats?.readyOrdersCount ?? "—"} sub="Waiting for rider" color="border-l-4 border-l-purple-500 border-neutral-100" />
        </div>

        {/* Restaurant info */}
        {restaurant && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft flex flex-col sm:flex-row gap-5">
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&fit=crop"} alt={restaurant.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-black text-black">{restaurant.name}</h2>
                  <p className="text-sm text-neutral-500">{restaurant.category} · ★ {restaurant.rating?.toFixed(1)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {restaurant.isOpen ? "● Open" : "● Closed"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-black">Recent Orders</h2>
            <Link href="/vendor/orders" className="text-sm font-bold text-amber-600 hover:text-amber-500 transition-colors">
              View All →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center">
              <span className="text-5xl">🍽️</span>
              <h3 className="mt-4 font-bold text-black">No orders yet</h3>
              <p className="mt-1 text-sm text-neutral-500">Orders will appear here as customers place them.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-100 bg-white shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Time"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-black text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {orders.map((order) => {
                      const sc = STATUS_LABELS[order.status] || { label: order.status, color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" };
                      const customer = order.customerId;
                      const itemCount = order.items?.length || 0;
                      const firstItem = order.items?.[0];
                      const itemName = firstItem?.menuItemId?.name || firstItem?.name || "Item";
                      return (
                        <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-neutral-400">#{String(order._id).slice(-6).toUpperCase()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-black">{customer?.name || "Customer"}</p>
                            <p className="text-xs text-neutral-400">{customer?.phone || ""}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-black">{itemName}</p>
                            {itemCount > 1 && <p className="text-xs text-neutral-400">+{itemCount - 1} more</p>}
                          </td>
                          <td className="px-5 py-4 font-black text-black">৳{Number(order.totalAmount).toFixed(0)}</td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-xs font-medium text-neutral-600">{order.paymentMethod?.replace("_", " ")}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${sc.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-neutral-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "🍕", title: "Manage Menu", desc: "Add, edit, or remove menu items", href: "/vendor/menu" },
            { icon: "📋", title: "All Orders", desc: "View and manage all incoming orders", href: "/vendor/orders" },
            { icon: "⚙️", title: "Restaurant Settings", desc: "Update your restaurant details", href: "/vendor/restaurant" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <span className="text-3xl">{action.icon}</span>
              <h3 className="mt-3 font-bold text-black">{action.title}</h3>
              <p className="text-xs text-neutral-500 mt-1">{action.desc}</p>
              <p className="mt-3 text-xs font-bold text-amber-600 group-hover:text-amber-500">Open →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
