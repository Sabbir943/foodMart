"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("new"); // new, preparing, ready, past
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders. Make sure you are logged in as a vendor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, updates) => {
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      fetchOrders();
      toast.success(data.message || "Order updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update order");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    switch (activeTab) {
      case "new":
        return orders.filter((o) => o.status === "placed");
      case "preparing":
        return orders.filter((o) => o.status === "confirmed" || (o.status === "preparing" && !o.isReadyForPickup));
      case "ready":
        return orders.filter((o) => o.status === "preparing" && o.isReadyForPickup);
      case "past":
        return orders.filter((o) => o.status === "delivered" || o.status === "cancelled");
      default:
        return [];
    }
  };

  const filteredOrders = getFilteredOrders();

  if (loading && orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 w-full animate-pulse rounded bg-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Manage Orders</h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Accept requests, track preparation, and mark dishes ready for delivery riders.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto whitespace-nowrap">
        {[
          { key: "new", label: `New Requests (${orders.filter((o) => o.status === "placed").length})` },
          { key: "preparing", label: `Preparing (${orders.filter((o) => o.status === "confirmed" || (o.status === "preparing" && !o.isReadyForPickup)).length})` },
          { key: "ready", label: `Ready for Pickup (${orders.filter((o) => o.status === "preparing" && o.isReadyForPickup).length})` },
          { key: "past", label: `Completed / Cancelled (${orders.filter((o) => ["delivered", "cancelled"].includes(o.status)).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 py-4 px-6 text-sm font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === tab.key
                ? "border-black text-black"
                : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl">
          <span className="text-4xl">📦</span>
          <h3 className="mt-4 text-lg font-bold text-black">No Orders Found</h3>
          <p className="mt-1 text-sm text-neutral-500">There are no orders in this category right now.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card
              key={order._id}
              className="shadow-soft rounded-2xl border border-neutral-100 flex flex-col justify-between"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-neutral-400 block uppercase">Order ID</span>
                    <strong className="text-black text-sm">
                      #{order._id.substring(order._id.length - 8).toUpperCase()}
                    </strong>
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <hr className="border-neutral-100" />

                {/* Customer Details */}
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Customer</span>
                  <div className="font-bold text-neutral-900 text-sm mt-0.5">
                    {order.customerId?.name || "Guest Customer"}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">{order.customerId?.phone || "No phone"}</div>
                  <div className="text-xs text-neutral-600 mt-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                    <strong className="text-neutral-700">Deliver to:</strong> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                  </div>
                </div>

                <hr className="border-neutral-100" />

                {/* Items */}
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Items</span>
                  <ul className="mt-1 space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-neutral-600">
                        <strong className="text-black font-semibold">{item.qty}x</strong> {item.menuItemId?.name || "Menu Item"}{" "}
                        {item.variant && <span className="text-[10px] text-neutral-400">({item.variant})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 pb-6 pt-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between rounded-b-2xl">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Amount</span>
                  <strong className="text-black text-base font-extrabold">
                    ${order.totalAmount.toFixed(2)}
                  </strong>
                </div>

                <div className="flex gap-2">
                  {/* Cancel Option */}
                  {["placed", "confirmed"].includes(order.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl px-3 font-semibold text-xs"
                      onClick={() => handleUpdateStatus(order._id, { status: "cancelled" })}
                    >
                      Cancel
                    </Button>
                  )}

                  {/* Accept Option */}
                  {order.status === "placed" && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-black hover:bg-neutral-800 text-white rounded-xl font-bold px-4 text-xs cursor-pointer"
                      onClick={() => handleUpdateStatus(order._id, { status: "confirmed" })}
                    >
                      Accept
                    </Button>
                  )}

                  {/* Start Preparing */}
                  {order.status === "confirmed" && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold px-4 text-xs cursor-pointer"
                      onClick={() => handleUpdateStatus(order._id, { status: "preparing" })}
                    >
                      Prepare
                    </Button>
                  )}

                  {/* Mark Ready */}
                  {order.status === "preparing" && !order.isReadyForPickup && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold px-4 text-xs cursor-pointer"
                      onClick={() => handleUpdateStatus(order._id, { isReadyForPickup: true })}
                    >
                      Ready
                    </Button>
                  )}

                  {/* status tag for ready or completed */}
                  {order.status === "preparing" && order.isReadyForPickup && (
                    <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 font-bold px-3 py-1 rounded-xl">
                      Awaiting Rider
                    </span>
                  )}

                  {order.status === "delivered" && (
                    <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-3 py-1 rounded-xl">
                      Delivered ✓
                    </span>
                  )}

                  {order.status === "cancelled" && (
                    <span className="text-xs bg-rose-50 border border-rose-200 text-rose-700 font-bold px-3 py-1 rounded-xl">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
