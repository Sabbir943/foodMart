"use client";

import { useState, useEffect } from "react";
import { Card } from "@heroui/react";

export default function RiderHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rider/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load delivery history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && history.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 w-full animate-pulse rounded bg-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate earnings ($5 flat fee per delivery)
  const totalEarnings = history.length * 5.0;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 bg-white min-h-screen">
      {/* Header Summary */}
      <div className="mb-8 bg-black text-white rounded-3xl p-6 border border-neutral-900 shadow-lg flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Summary</span>
          <h2 className="text-xl font-bold mt-1">My Deliveries</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Total Deliveries: {history.length}</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Total Payout</span>
          <strong className="text-2xl font-extrabold text-amber-500">${totalEarnings.toFixed(2)}</strong>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Delivery Cards */}
      {history.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl">
          <span className="text-4xl">🚲</span>
          <h3 className="mt-4 text-lg font-bold text-black">No Deliveries Yet</h3>
          <p className="mt-1 text-sm text-neutral-500">Completed deliveries will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {history.map((delivery) => (
            <Card
              key={delivery._id}
              className="shadow-soft rounded-2xl border border-neutral-100 p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-neutral-900">
                    Order #{delivery._id.substring(delivery._id.length - 8).toUpperCase()}
                  </span>
                  <span className="text-neutral-500 font-medium">
                    {formatDate(delivery.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block">From</span>
                    <strong className="text-neutral-800 font-semibold">{delivery.restaurantId?.name}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block">Payout</span>
                    <strong className="text-emerald-600 font-bold">$5.00 Payout</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Delivery To</span>
                  <p className="text-xs text-neutral-700 mt-0.5">{delivery.deliveryAddress?.street}</p>
                </div>

                {/* Rating received */}
                <div className="border-t border-neutral-100 pt-3 flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">Customer Rating:</span>
                  {delivery.riderRating ? (
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      ★ {delivery.riderRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-neutral-400 font-bold">Pending Rating</span>
                  )}
                </div>

                {delivery.reviewComment && (
                  <div className="text-[10px] italic text-neutral-500 bg-neutral-50 p-2 rounded-lg border border-neutral-100 mt-2">
                    "{delivery.reviewComment}"
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
