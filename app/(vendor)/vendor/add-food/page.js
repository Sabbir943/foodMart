"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import VendorShell from "@/components/VendorShell";

const CATEGORIES = [
  "Pizza", "Pasta", "Burgers", "Italian", "Asian", "Chinese",
  "Indian", "Thai", "Seafood", "Steakhouse", "Mexican",
  "Dessert", "Cafe", "Bakery", "Sides", "Drinks", "General",
];

export default function AddFoodPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const {
    register, handleSubmit, control, reset, setValue, watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "", description: "", price: "", category: "Pizza", isAvailable: true, variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

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

  useEffect(() => {
    if (!user) return;
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vendor/restaurant");
        const data = await res.json();
        if (data.restaurant) {
          setRestaurant(data.restaurant);
        } else {
          toast.error("Please set up your restaurant first");
          router.push("/vendor/restaurant");
        }
      } catch {
        toast.error("Failed to load restaurant");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [user, router]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setImagePreview(data.url);
        setValue("imageUrl", data.url);
        toast.success("Image uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, imageUrl: imagePreview };
      const res = await fetch("/api/vendor/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add food");

      toast.success("Food item added successfully!");
      reset();
      setImagePreview("");
      router.push("/vendor/menu");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <VendorShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
            <p className="text-sm text-neutral-500 font-medium">Loading...</p>
          </div>
        </div>
      </VendorShell>
    );
  }

  if (!user) return null;

  return (
    <VendorShell>
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Add Food Item</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Add a new dish to <span className="text-white font-semibold">{restaurant?.name || "your restaurant"}</span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info Card */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-extrabold text-black mb-5">Food Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Food Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Biryani"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && <p className="text-[10px] text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Price (BDT) *</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="350"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    {...register("price", { required: "Price is required", min: { value: 1, message: "Price must be at least 1" } })}
                  />
                  {errors.price && <p className="text-[10px] text-red-600 mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Category *</label>
                  <select
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    {...register("category")}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Description</label>
                <textarea
                  placeholder="Describe this dish..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  {...register("description")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Food Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {uploadingImage && <p className="text-[10px] text-amber-600 mt-1">Uploading...</p>}
              </div>

              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-24 rounded-xl object-cover border border-neutral-100" />
              )}
            </div>
          </div>

          {/* Variants Card */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-soft">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-extrabold text-black">Variants / Sizes</h2>
              <button
                type="button"
                onClick={() => append({ name: "", priceModifier: "" })}
                className="text-xs font-bold text-amber-600 hover:text-amber-500 cursor-pointer"
              >
                + Add Variant
              </button>
            </div>
            <p className="text-xs text-neutral-400 mb-4">Optional: add size variations like Large, Medium, etc.</p>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Variant name (e.g. Large)"
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register(`variants.${index}.name`)}
                  />
                  <input
                    type="number"
                    step="1"
                    placeholder="Price modifier"
                    className="w-32 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register(`variants.${index}.priceModifier`)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-400 px-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-450 px-8 py-3 text-white font-bold text-sm transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]"
            >
              Add Food Item
            </button>
          </div>
        </form>
      </div>
    </VendorShell>
  );
}
