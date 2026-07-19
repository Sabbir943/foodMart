"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vendors");
      if (!res.ok) throw new Error("Failed to load vendors");
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load vendors list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchVendors();
    });
    return () => {
      active = false;
    };
  }, []);

  const handleVendorAction = async (userId, action) => {
    const confirmation = window.confirm(`Are you sure you want to ${action} this vendor?`);
    if (!confirmation) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vendor");

      toast.success(data.message || "Action successful");
      fetchVendors();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-6 bg-white min-h-[80vh]">
        <div className="h-10 w-48 animate-pulse rounded bg-neutral-200" />
        <Card className="h-96 w-full animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 bg-white min-h-screen">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Partners</span>
        <h1 className="text-3xl font-black text-black mt-1">Manage Vendors</h1>
        <p className="text-xs text-neutral-500 mt-1">Approve, reject, or suspend restaurant owner profiles.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table Card */}
      <Card className="shadow-soft rounded-3xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Vendor Info</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-neutral-400">
                    No vendors registered yet.
                  </td>
                </tr>
              ) : (
                vendors.map(({ vendor, restaurant }) => (
                  <tr key={vendor._id} className="hover:bg-neutral-50/50 transition-colors">
                    {/* Vendor Info */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-black">{vendor.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{vendor.email}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{vendor.phone}</div>
                    </td>
                    
                    {/* Restaurant details */}
                    <td className="px-6 py-4">
                      {restaurant ? (
                        <div>
                          <div className="font-bold text-neutral-900">{restaurant.name}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {restaurant.address?.street}, {restaurant.address?.city}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No restaurant setup</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      {restaurant ? (
                        <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg">
                          {restaurant.category}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            vendor.isBlocked
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : restaurant?.isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {vendor.isBlocked
                            ? "Suspended"
                            : restaurant?.isApproved
                            ? "Approved"
                            : "Pending Approval"}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {vendor.isBlocked ? (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleVendorAction(vendor._id, "unban")}
                            className="rounded-xl bg-black text-white hover:bg-neutral-800 font-bold text-xs px-4 py-1.5 cursor-pointer"
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <>
                            {!restaurant?.isApproved && (
                              <Button
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleVendorAction(vendor._id, "approve")}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 cursor-pointer"
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => handleVendorAction(vendor._id, "suspend")}
                              className="rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold text-xs px-4 py-1.5 cursor-pointer"
                            >
                              Suspend
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
