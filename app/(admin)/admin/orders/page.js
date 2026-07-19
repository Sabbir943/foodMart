"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";

const statuses = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (status) query.set("status", status);

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load platform orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, status]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 bg-white min-h-screen">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Transactions</span>
        <h1 className="text-3xl font-black text-black mt-1">Platform Orders</h1>
        <p className="text-xs text-neutral-500 mt-1">Monitor, query, and filter orders globally across all restaurants.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters & Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or Restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Filter status */}
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.replace("_", " ")}
              </option>
            ))}
          </select>

          {(search || status) && (
            <Button
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
              className="rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-bold text-xs px-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="shadow-soft rounded-3xl border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="px-6 py-24 text-center text-neutral-400 animate-pulse">
            Loading order details...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-neutral-400">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* ID */}
                      <td className="px-6 py-4 font-mono font-bold text-xs uppercase text-neutral-900">
                        #{order._id.substring(order._id.length - 8)}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-black">{order.customerId?.name || "Unknown"}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{order.customerId?.phone}</div>
                      </td>

                      {/* Restaurant */}
                      <td className="px-6 py-4 font-bold text-neutral-900">
                        {order.restaurantId?.name || "Unknown"}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 font-extrabold text-neutral-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : order.paymentStatus === "failed"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                          <span className="text-[10px] font-medium text-neutral-400 capitalize">
                            Via {order.paymentMethod.replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            order.status === "delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : order.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
