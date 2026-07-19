"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Pizza", "Pasta", "Burgers", "Italian", "Asian", "Chinese",
  "Indian", "Thai", "Seafood", "Steakhouse", "Mexican",
  "Dessert", "Cafe", "Bakery", "Sides", "Drinks", "General",
];

export default function VendorMenuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    register, handleSubmit, control, reset, setValue, watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "", description: "", price: "", category: "Pizza", isAvailable: true, variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login?returnTo=/vendor/menu");
  }, [user, authLoading, router]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/menu");
      if (!res.ok) throw new Error("Failed to fetch menu");
      const data = await res.json();
      setMenuItems(data.menuItems || []);
    } catch {
      setError("Failed to load menu. Make sure your restaurant is set up.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMenu();
  }, [user]);

  const openAddModal = () => {
    setEditingItem(null);
    setImagePreview("");
    reset({ name: "", description: "", price: "", category: "Pizza", isAvailable: true, variants: [] });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setImagePreview(item.imageUrl || "");
    reset({
      name: item.name, description: item.description || "",
      price: item.price, category: item.category,
      isAvailable: item.isAvailable, variants: item.variants || [],
    });
    setShowModal(true);
  };

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
      const url = editingItem ? `/api/vendor/menu/${editingItem._id}` : "/api/vendor/menu";
      const method = editingItem ? "PUT" : "POST";
      const payload = { ...data, imageUrl: imagePreview };
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");
      setShowModal(false);
      fetchMenu();
      toast.success(editingItem ? "Item updated!" : "Item added!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      const res = await fetch(`/api/vendor/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchMenu();
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await fetch(`/api/vendor/menu/${item._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (!res.ok) throw new Error("Failed");
      fetchMenu();
      toast.success("Updated!");
    } catch {
      toast.error("Update failed");
    }
  };

  const filtered = menuItems.filter((item) => {
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = ["All", ...new Set(menuItems.map((i) => i.category))];

  if (authLoading || (loading && menuItems.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 py-10 px-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/vendor/dashboard" className="text-xs font-bold text-amber-400 hover:text-amber-300 mb-3 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage Menu</h1>
              <p className="mt-1 text-sm text-neutral-400">Add, edit, and control your dishes.</p>
            </div>
            <button
              onClick={openAddModal}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer"
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6 text-center">{error}</div>
        )}

        {/* Filters */}
        {menuItems.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterCategory === cat
                      ? "bg-black text-white"
                      : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        {menuItems.length === 0 && !loading ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl bg-white">
            <span className="text-5xl">🍕</span>
            <h3 className="mt-4 text-lg font-bold text-black">Your Menu is Empty</h3>
            <p className="mt-1 text-sm text-neutral-500">Add your first dish to get started.</p>
            <button onClick={openAddModal} className="mt-6 rounded-2xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-white font-bold text-sm transition-all cursor-pointer">
              Add Menu Item
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
            <span className="text-4xl">🔍</span>
            <h3 className="mt-3 font-bold text-black">No items found</h3>
            <p className="mt-1 text-sm text-neutral-500">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-100 bg-white shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Item</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Variants</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map((item) => (
                    <tr key={item._id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop"}
                            alt={item.name}
                            className="h-10 w-10 rounded-xl object-cover bg-neutral-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-black text-xs truncate">{item.name}</p>
                            <p className="text-[10px] text-neutral-400 truncate max-w-[140px]">{item.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 rounded-full px-2 py-0.5">{item.category}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-black text-black text-xs">৳{item.price.toFixed(0)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {item.variants?.length > 0 ? (
                          <div className="space-y-0.5">
                            {item.variants.map((v) => (
                              <span key={v.name} className="block text-[10px] text-neutral-500">
                                {v.name} (+৳{v.priceModifier})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggle(item)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer transition-all ${
                            item.isAvailable
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(item)} className="rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1 text-[10px] font-bold transition-all cursor-pointer">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="rounded-lg bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 text-[10px] font-bold transition-all cursor-pointer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400">{filtered.length} item{filtered.length !== 1 ? "s" : ""} total</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white shadow-2xl border border-neutral-100 my-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-black">{editingItem ? "Edit Item" : "Add New Item"}</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer transition-all">
                <svg className="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Name *</label>
                  <input
                    type="text" placeholder="Pepperoni Pizza"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && <p className="text-[10px] text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Base Price (৳) *</label>
                  <input
                    type="number" step="1" placeholder="350"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register("price", { required: "Price is required" })}
                  />
                  {errors.price && <p className="text-[10px] text-red-600 mt-1">{errors.price.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Category</label>
                  <select className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer" {...register("category")}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Image</label>
                  <input
                    type="file" accept="image/*" onChange={handleImageUpload}
                    className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-black hover:file:bg-neutral-200"
                  />
                  {uploadingImage && <p className="text-[10px] text-amber-600 mt-1">Uploading...</p>}
                </div>
              </div>

              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-20 mx-auto rounded-xl object-cover border border-neutral-100" />
              )}

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Description</label>
                <textarea
                  placeholder="Describe this dish..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 h-20 resize-none"
                  {...register("description")}
                />
              </div>

              {/* Variants */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black text-neutral-800 uppercase tracking-wide">Variants / Sizes</h4>
                  <button type="button" onClick={() => append({ name: "", priceModifier: "" })} className="text-[10px] font-bold text-amber-600 hover:text-amber-500 cursor-pointer">
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input type="text" placeholder="Large 12''" className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs focus:outline-none" {...register(`variants.${index}.name`)} />
                      <input type="number" step="1" placeholder="+50" className="w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs focus:outline-none" {...register(`variants.${index}.priceModifier`)} />
                      <button type="button" onClick={() => remove(index)} className="text-[10px] font-bold text-red-500 hover:text-red-400 px-1 cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-500 hover:bg-neutral-100 transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-black hover:bg-neutral-800 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer">
                  {editingItem ? "Update" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
