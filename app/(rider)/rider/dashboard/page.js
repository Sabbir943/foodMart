"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function RiderDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rider, setRider] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rider/dashboard");
      if (!res.ok) throw new Error("Failed to load rider details");
      const data = await res.json();
      setRider(data.rider);
      setActiveOrder(data.activeOrder || null);
      setAvailableOrders(data.availableOrders || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch rider dashboard. Make sure you are registered and logged in as a rider.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated as rider
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?returnTo=/rider/dashboard");
    if (!authLoading && user && user.role !== "rider") router.replace("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== "rider") return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchDashboard();
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleToggleOnline = async () => {
    if (!rider) return;
    const nextAvailability = !rider.isAvailable;

    try {
      const res = await fetch("/api/rider/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextAvailability }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update availability");

      setRider((prev) => ({ ...prev, isAvailable: data.isAvailable }));
      toast.success(data.isAvailable ? "You are now Online 🟢" : "You are now Offline 🔴");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/rider/orders/${orderId}/accept`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept order");

      toast.success("Delivery accepted! 🛵");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to accept order");
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeOrder) return;

    try {
      const res = await fetch(`/api/rider/orders/${activeOrder._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update delivery status");

      toast.success(data.message || `Status updated: ${status}`);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    }
  };

  if (loading && !rider) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 mb-6" />
        <div className="h-32 w-full animate-pulse rounded bg-neutral-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 bg-white min-h-screen">
      {/* Rider Info Header */}
      <div className="mb-8 flex justify-between items-center bg-neutral-900 text-white rounded-3xl p-6 border border-neutral-800 shadow-lg">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Rider Portal</span>
          <h2 className="text-xl font-bold mt-1">{rider?.name}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Rating: ★ {rider?.rating ? rider.rating.toFixed(1) : "New"}</p>
        </div>

        {/* Toggle online/offline */}
        <button
          onClick={handleToggleOnline}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border ${
            rider?.isAvailable
              ? "bg-emerald-600 border-emerald-500 text-white"
              : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"
          }`}
        >
          {rider?.isAvailable ? "Online" : "Offline"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Active Order Section */}
      {activeOrder ? (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-black">Active Delivery</h3>
          
          <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Order Reference</span>
                <strong className="text-black text-sm uppercase">
                  #{activeOrder._id.substring(activeOrder._id.length - 8)}
                </strong>
              </div>
              <span className="text-xs font-bold uppercase bg-amber-500 text-black px-2.5 py-1 rounded-lg">
                {activeOrder.status === "out_for_delivery" ? "In Transit" : "Preparing"}
              </span>
            </div>

            {/* Restaurant Pickup Details */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Pickup from</span>
              <div className="font-bold text-neutral-900 text-sm mt-0.5">{activeOrder.restaurantId?.name}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {activeOrder.restaurantId?.address?.street}, {activeOrder.restaurantId?.address?.city}
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Customer Drop-off Details */}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Deliver to</span>
              <div className="font-bold text-neutral-900 text-sm mt-0.5">{activeOrder.deliveryAddress?.street}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{activeOrder.deliveryAddress?.city}</div>
              {activeOrder.deliveryAddress?.instructions && (
                <div className="text-xs text-amber-700 mt-2 italic bg-amber-50/50 p-2.5 border border-amber-100 rounded-xl">
                  Note: &quot;{activeOrder.deliveryAddress.instructions}&quot;
                </div>
              )}
            </div>

            <hr className="border-neutral-100" />

            {/* Action Buttons */}
            <div className="space-y-2">
              {activeOrder.status === "preparing" && (
                <Button
                  onClick={() => handleUpdateStatus("picked_up")}
                  className="w-full rounded-xl bg-black hover:bg-neutral-800 text-white font-bold py-3 cursor-pointer"
                >
                  Mark as Picked Up
                </Button>
              )}

              {activeOrder.status === "out_for_delivery" && (
                <Button
                  onClick={() => handleUpdateStatus("delivered")}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 cursor-pointer"
                >
                  Mark as Delivered
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Available Deliveries Section */
        <div className="space-y-6">
          <h3 className="text-lg font-black text-black">Available Requests</h3>

          {!rider?.isAvailable ? (
            <div className="text-center py-12 bg-neutral-50 border border-neutral-100 rounded-3xl">
              <span className="text-3xl">📴</span>
              <h4 className="font-bold text-neutral-800 mt-4 text-sm">You are Offline</h4>
              <p className="text-xs text-neutral-400 mt-1">Go online to start receiving delivery requests.</p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 border border-neutral-100 rounded-3xl">
              <span className="text-3xl">⏳</span>
              <h4 className="font-bold text-neutral-800 mt-4 text-sm">Searching for Orders</h4>
              <p className="text-xs text-neutral-400 mt-1">Waiting for restaurants to mark meals ready...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <Card
                  key={order._id}
                  className="shadow-soft rounded-2xl border border-neutral-100 p-5 flex flex-col justify-between hover:shadow-soft-lg transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <strong className="text-black text-xs uppercase">
                        #{order._id.substring(order._id.length - 8)}
                      </strong>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full uppercase">
                        Ready for Pickup
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">Pickup</span>
                      <div className="font-bold text-neutral-900 text-xs mt-0.5">{order.restaurantId?.name}</div>
                      <div className="text-[10px] text-neutral-500">{order.restaurantId?.address?.street}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">Drop-off</span>
                      <div className="font-bold text-neutral-900 text-xs mt-0.5">{order.deliveryAddress?.street}</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAcceptOrder(order._id)}
                    className="w-full mt-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold py-2 text-xs cursor-pointer"
                  >
                    Accept Delivery Request
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
