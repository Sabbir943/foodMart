"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABELS = {
  placed: { label: "New", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  confirmed: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  preparing: { label: "Preparing", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  out_for_delivery: { label: "On the Way", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

function StatCard({ icon, label, value, sub, borderColor }) {
  return (
    <div className={`rounded-2xl border border-neutral-100 bg-white p-5 shadow-soft hover:shadow-soft-lg transition-all ${borderColor ? `border-l-4 ${borderColor}` : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-black">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
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
  const [noRestaurant, setNoRestaurant] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?returnTo=/vendor/dashboard");
    if (!authLoading && user && user.role !== "vendor" && user.role !== "admin") router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || (user.role !== "vendor" && user.role !== "admin")) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/vendor/stats"),
          fetch("/api/vendor/orders"),
        ]);

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();

        if (statsData.source === "mock" && statsData.restaurant?._id?.startsWith("mock_")) {
          setNoRestaurant(true);
        }

        setStats(statsData.stats || null);
        setRestaurant(statsData.restaurant || null);
        setOrders((ordersData.orders || []).slice(0, 8));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // No restaurant yet — show setup prompt
  if (noRestaurant) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-10 px-4">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Vendor Panel</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome, {user.name}!</h1>
          </div>
        </div>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12">
            <span className="text-6xl">🏪</span>
            <h2 className="mt-6 text-2xl font-extrabold text-black">Set Up Your Restaurant</h2>
            <p className="mt-3 text-sm text-neutral-500 max-w-sm mx-auto">
              Create your restaurant profile to start listing menu items and receiving orders from customers.
            </p>
            <Link
              href="/vendor/restaurant"
              className="mt-8 inline-block rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-450 px-8 py-3.5 text-white font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20"
            >
              Setup Restaurant
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Vendor Panel</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{restaurant?.name || "Your Kitchen"}</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Welcome back, <span className="text-white font-semibold">{user.name}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vendor/restaurant" className="rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all">
              Restaurant
            </Link>
            <Link href="/vendor/menu" className="rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all">
              Menu
            </Link>
            <Link href="/vendor/orders" className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-bold text-white transition-all">
              Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="📦" label="Today's Orders" value={stats?.todayOrdersCount ?? "0"} sub="Placed today" borderColor="border-l-blue-500" />
          <StatCard icon="💰" label="Today's Revenue" value={`৳${Number(stats?.todayRevenue ?? 0).toFixed(0)}`} sub="From delivered" borderColor="border-l-emerald-500" />
          <StatCard icon="⏳" label="Pending" value={stats?.pendingOrdersCount ?? "0"} sub="Needs attention" borderColor="border-l-amber-500" />
          <StatCard icon="🛵" label="Ready" value={stats?.readyOrdersCount ?? "0"} sub="Awaiting rider" borderColor="border-l-purple-500" />
        </div>

        {/* Restaurant Info Bar */}
        {restaurant && !restaurant._id?.startsWith("mock_") && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-soft flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={restaurant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&fit=crop"}
              alt={restaurant.name}
              className="h-14 w-14 rounded-xl object-cover bg-neutral-100 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-black truncate">{restaurant.name}</h3>
              <p className="text-xs text-neutral-500">{restaurant.category} • ★ {restaurant.rating?.toFixed(1) || "0.0"}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {restaurant.isOpen ? "Open" : "Closed"}
              </span>
              <Link href="/vendor/restaurant" className="text-xs font-bold text-amber-600 hover:text-amber-500">
                Edit →
              </Link>
            </div>
          </div>
        )}

        {/* Recent Orders Table */}
        <div className="rounded-2xl border border-neutral-100 bg-white shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h2 className="text-lg font-extrabold text-black">Recent Orders</h2>
            <Link href="/vendor/orders" className="text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors">
              View All →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-5xl">🍽️</span>
              <h3 className="mt-4 font-bold text-black">No orders yet</h3>
              <p className="mt-1 text-sm text-neutral-500">Orders will appear here as customers place them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Items</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Payment</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Time</th>
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
                      <tr key={order._id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-neutral-600">#{String(order._id).slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-black text-xs">{customer?.name || "Guest"}</p>
                          <p className="text-[10px] text-neutral-400">{customer?.phone || ""}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium text-black truncate max-w-[160px]">{itemName}{itemCount > 1 ? ` +${itemCount - 1}` : ""}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-black text-black text-xs">৳{Number(order.totalAmount).toFixed(0)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="capitalize text-[10px] font-semibold text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5">
                            {order.paymentMethod?.replace("_", " ") || "cash"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${sc.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[10px] text-neutral-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "🍕", title: "Manage Menu", desc: "Add, edit, or remove dishes", href: "/vendor/menu", color: "from-blue-50 to-blue-100 border-blue-200" },
            { icon: "📋", title: "All Orders", desc: "View and manage incoming orders", href: "/vendor/orders", color: "from-amber-50 to-amber-100 border-amber-200" },
            { icon: "⚙️", title: "Restaurant Settings", desc: "Update your restaurant details", href: "/vendor/restaurant", color: "from-purple-50 to-purple-100 border-purple-200" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`rounded-2xl border bg-gradient-to-br p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group ${action.color}`}
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
