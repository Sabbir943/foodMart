"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Pizza", "Pasta", "Burgers", "Italian", "Asian", "Chinese",
  "Indian", "Thai", "Seafood", "Steakhouse", "Mexican",
  "Dessert", "Cafe", "Bakery", "General",
];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

export default function VendorRestaurantPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "General",
    logoUrl: "",
    street: "",
    city: "Dhaka",
    district: "",
    postalCode: "",
    operatingHours: DAYS.map((day) => ({ day, open: "09:00", close: "22:00", isClosed: day === "sun" })),
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?returnTo=/vendor/restaurant");
  }, [user, authLoading, router]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/restaurant");
      const data = await res.json();
      if (data.restaurant) {
        setRestaurant(data.restaurant);
        setIsNew(false);
        setForm({
          name: data.restaurant.name || "",
          description: data.restaurant.description || "",
          category: data.restaurant.category || "General",
          logoUrl: data.restaurant.logoUrl || "",
          street: data.restaurant.address?.street || "",
          city: data.restaurant.address?.city || "Dhaka",
          district: data.restaurant.address?.district || "",
          postalCode: data.restaurant.address?.postalCode || "",
          operatingHours: data.restaurant.operatingHours?.length > 0
            ? data.restaurant.operatingHours
            : DAYS.map((day) => ({ day, open: "09:00", close: "22:00", isClosed: day === "sun" })),
        });
      } else {
        setIsNew(true);
      }
    } catch {
      setIsNew(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRestaurant();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        logoUrl: form.logoUrl,
        address: {
          street: form.street,
          city: form.city,
          district: form.district,
          postalCode: form.postalCode,
        },
        operatingHours: form.operatingHours,
      };

      const url = "/api/vendor/restaurant";
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(isNew ? "Restaurant created!" : "Restaurant updated!");
      setRestaurant(data.restaurant);
      setIsNew(false);
      router.push("/vendor/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (index, field, value) => {
    const updated = [...form.operatingHours];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, operatingHours: updated });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-10 px-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/vendor/dashboard" className="text-xs font-bold text-amber-400 hover:text-amber-300 mb-3 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isNew ? "Setup Your Restaurant" : "Restaurant Settings"}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {isNew ? "Create your restaurant profile to start receiving orders." : "Update your restaurant details and operating hours."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-extrabold text-black mb-5">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Restaurant Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Pizza Palace"
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell customers what makes your restaurant special..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.jpg"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="Logo preview" className="mt-3 h-16 w-16 rounded-xl object-cover border border-neutral-100" />
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-extrabold text-black mb-5">Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Street Address *</label>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="e.g. 123 Main Street, Gulshan"
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">District</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="e.g. Dhaka"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-extrabold text-black mb-5">Operating Hours</h2>
            <div className="space-y-3">
              {DAYS.map((day, i) => {
                const hours = form.operatingHours.find((h) => h.day === day) || {};
                return (
                  <div key={day} className="flex items-center gap-4 py-3 border-b border-neutral-50 last:border-0">
                    <div className="w-24 shrink-0">
                      <span className="text-sm font-bold text-black">{DAY_LABELS[day]}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <div
                        onClick={() => updateHours(i, "isClosed", !hours.isClosed)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${hours.isClosed ? "bg-red-400" : "bg-emerald-400"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hours.isClosed ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                      <span className="text-xs text-neutral-500">{hours.isClosed ? "Closed" : "Open"}</span>
                    </label>
                    {!hours.isClosed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hours.open || "09:00"}
                          onChange={(e) => updateHours(i, "open", e.target.value)}
                          className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <span className="text-xs text-neutral-400">to</span>
                        <input
                          type="time"
                          value={hours.close || "22:00"}
                          onChange={(e) => updateHours(i, "close", e.target.value)}
                          className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/vendor/dashboard" className="text-sm font-semibold text-neutral-500 hover:text-black transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-450 px-8 py-3 text-white font-bold text-sm transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isNew ? "Create Restaurant" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
