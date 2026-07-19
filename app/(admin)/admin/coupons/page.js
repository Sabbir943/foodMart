"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [formLoading, setFormLoading] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to load coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch coupons list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchCoupons();
    });
    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setMinOrderAmount("");
    setExpiryDate("");
    setIsActive(true);
  };

  const handleEditClick = (coupon) => {
    setEditingId(coupon._id);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue.toString());
    setMinOrderAmount(coupon.minOrderAmount.toString());
    setExpiryDate(new Date(coupon.expiryDate).toISOString().substring(0, 10));
    setIsActive(coupon.isActive);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountValue || !expiryDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        expiryDate: new Date(expiryDate).toISOString(),
        isActive,
      };

      let res;
      if (editingId) {
        payload.id = editingId;
        res = await fetch("/api/admin/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save coupon");

      toast.success(editingId ? "Coupon updated successfully" : "Coupon created successfully");
      resetForm();
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmation = window.confirm("Are you sure you want to delete this coupon?");
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete coupon");

      toast.success(data.message || "Coupon deleted");
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete coupon.");
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon._id, isActive: !coupon.isActive }),
      });

      if (!res.ok) throw new Error("Failed to toggle status");
      fetchCoupons();
      toast.success("Coupon status updated!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 bg-white min-h-screen">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Marketing</span>
        <h1 className="text-3xl font-black text-black mt-1">Manage Coupons</h1>
        <p className="text-xs text-neutral-500 mt-1">Create, update, and toggle discount codes for customers.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coupon Form Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-soft rounded-3xl border border-neutral-100 p-6 space-y-6">
            <h3 className="text-lg font-black text-black">
              {editingId ? "Edit Coupon" : "Create New Coupon"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="SAVE30"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  placeholder={discountType === "percent" ? "10" : "5.00"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Min Order Amount */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Min Order Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.00"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Is Active Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-neutral-500 uppercase tracking-wider cursor-pointer">
                  Coupon Active
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                {editingId && (
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-bold text-xs py-3 cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs py-3 cursor-pointer"
                >
                  {formLoading ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Coupons List Table Card */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft rounded-3xl border border-neutral-100 overflow-hidden">
            {loading ? (
              <div className="px-6 py-24 text-center text-neutral-400 animate-pulse">
                Loading coupons list...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Discount</th>
                      <th className="px-6 py-4">Min. Order</th>
                      <th className="px-6 py-4">Expiry</th>
                      <th className="px-6 py-4">Active</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-neutral-400">
                          No coupons registered. Create one to begin.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-black uppercase tracking-wider">
                            {coupon.code}
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-900">
                            {coupon.discountType === "percent"
                              ? `${coupon.discountValue}%`
                              : `$${coupon.discountValue.toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4 text-neutral-500">
                            ${coupon.minOrderAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-500">
                            {new Date(coupon.expiryDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={coupon.isActive}
                              onChange={() => handleToggleActive(coupon)}
                              className="h-4 w-4 rounded border-neutral-300 text-amber-500 accent-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleEditClick(coupon)}
                                className="rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold text-[10px] px-3 py-1 cursor-pointer"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(coupon._id)}
                                className="rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10px] px-3 py-1 cursor-pointer"
                              >
                                Delete
                              </Button>
                            </div>
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
      </div>
    </div>
  );
}
