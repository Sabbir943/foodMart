"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import VendorShell from "@/components/VendorShell";

const STATUS_LABELS = {
  placed: { label: "New Order", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  confirmed: { label: "Confirmed", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  preparing: { label: "Preparing", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  out_for_delivery: { label: "On the Way", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const TABS = [
  { key: "new", label: "New", icon: "🆕" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "ready", label: "Ready", icon: "✅" },
  { key: "past", label: "Past", icon: "📋" },
];

export default function VendorOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("new");
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  if (!user && !authLoading) {
    return (
      <VendorShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-5xl">🔒</span>
            <h2 className="text-xl font-bold text-black">You are not logged in</h2>
            <p className="text-sm text-neutral-500">Please sign in to access the vendor dashboard.</p>
            <a href="/auth/login" className="inline-block rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
              Sign In
            </a>
          </div>
        </div>
      </VendorShell>
    );
  }

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId, updates) => {
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      fetchOrders();
      toast.success(data.message || "Updated!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "new": return orders.filter((o) => o.status === "placed");
      case "preparing": return orders.filter((o) => o.status === "confirmed" || (o.status === "preparing" && !o.isReadyForPickup));
      case "ready": return orders.filter((o) => o.status === "preparing" && o.isReadyForPickup);
      case "past": return orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
      default: return [];
    }
  };

  const tabCounts = {
    new: orders.filter((o) => o.status === "placed").length,
    preparing: orders.filter((o) => o.status === "confirmed" || (o.status === "preparing" && !o.isReadyForPickup)).length,
    ready: orders.filter((o) => o.status === "preparing" && o.isReadyForPickup).length,
    past: orders.filter((o) => ["delivered", "cancelled"].includes(o.status)).length,
  };

  const filteredOrders = getFilteredOrders();

  if (authLoading || loading) {
    return (
      <VendorShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
            <p className="text-sm text-neutral-500 font-medium">Loading orders...</p>
          </div>
        </div>
      </VendorShell>
    );
  }

  return (
    <VendorShell>
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-10 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage Orders</h1>
          <p className="mt-1 text-sm text-neutral-400">Accept, prepare, and mark orders ready for riders.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-black text-white shadow-lg"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tabCounts[tab.key] > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  activeTab === tab.key ? "bg-amber-400 text-black" : "bg-neutral-200 text-neutral-600"
                }`}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl bg-white">
            <span className="text-5xl">📦</span>
            <h3 className="mt-4 text-lg font-bold text-black">No Orders</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {activeTab === "new" ? "No new orders right now." : "No orders in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const sc = STATUS_LABELS[order.status] || { label: order.status, color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" };
              const customer = order.customerId;
              const isExpanded = expandedOrder === order._id;

              return (
                <div key={order._id} className="rounded-2xl border border-neutral-100 bg-white shadow-soft overflow-hidden">
                  {/* Order Header */}
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <span className="font-mono text-xs font-bold text-neutral-500">#{String(order._id).slice(-6).toUpperCase()}</span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-neutral-100 hidden sm:block" />
                      <div>
                        <p className="text-xs font-bold text-black">{customer?.name || "Guest"}</p>
                        <p className="text-[10px] text-neutral-400">{customer?.phone || "No phone"}</p>
                      </div>
                      <div className="h-8 w-px bg-neutral-100 hidden sm:block" />
                      <div className="text-xs text-neutral-500 max-w-[200px] truncate">
                        {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sc.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      <span className="font-black text-black text-sm">৳{Number(order.totalAmount).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 pb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-700">
                          <span className="font-black">{item.qty}x</span>
                          {item.menuItemId?.name || "Item"}
                          {item.variant && <span className="text-neutral-400">({item.variant})</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expand details + Actions */}
                  <div className="px-5 py-3 bg-neutral-50/50 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                        className="text-[10px] font-bold text-neutral-500 hover:text-black cursor-pointer transition-colors"
                      >
                        {isExpanded ? "Hide Details ↑" : "View Details ↓"}
                      </button>
                      <span className="text-[10px] text-neutral-400 capitalize bg-white rounded-full px-2 py-0.5 border border-neutral-100">
                        {order.paymentMethod?.replace("_", " ") || "cash"}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {order.status === "placed" && (
                        <>
                          <button onClick={() => handleUpdateStatus(order._id, { status: "cancelled" })} className="rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer">
                            Cancel
                          </button>
                          <button onClick={() => handleUpdateStatus(order._id, { status: "confirmed" })} className="rounded-lg bg-black hover:bg-neutral-800 text-white px-4 py-1.5 text-[10px] font-bold transition-all cursor-pointer">
                            Accept
                          </button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <>
                          <button onClick={() => handleUpdateStatus(order._id, { status: "cancelled" })} className="rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer">
                            Cancel
                          </button>
                          <button onClick={() => handleUpdateStatus(order._id, { status: "preparing" })} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-white px-4 py-1.5 text-[10px] font-bold transition-all cursor-pointer">
                            Start Preparing
                          </button>
                        </>
                      )}
                      {order.status === "preparing" && !order.isReadyForPickup && (
                        <button onClick={() => handleUpdateStatus(order._id, { isReadyForPickup: true })} className="rounded-lg bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 text-[10px] font-bold transition-all cursor-pointer">
                          Mark Ready
                        </button>
                      )}
                      {order.status === "preparing" && order.isReadyForPickup && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 text-purple-700 px-3 py-1.5 text-[10px] font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                          Awaiting Rider
                        </span>
                      )}
                      {order.status === "delivered" && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-700 px-3 py-1.5 text-[10px] font-bold">Delivered ✓</span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-[10px] font-bold">Cancelled</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50/30">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Delivery Address</p>
                          <p className="text-neutral-700">{order.deliveryAddress?.street}</p>
                          <p className="text-neutral-500">{order.deliveryAddress?.city}, {order.deliveryAddress?.district}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Payment</p>
                          <p className="text-neutral-700 capitalize">{order.paymentMethod?.replace("_", " ")}</p>
                          <p className={`font-bold ${order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                            {order.paymentStatus || "pending"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Order Items</p>
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-neutral-700">
                              {item.qty}x {item.menuItemId?.name || "Item"} — ৳{Number(item.price * item.qty).toFixed(0)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </VendorShell>
  );
}
