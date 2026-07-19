"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function VendorMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null means adding new item
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "Pizza",
      isAvailable: true,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/menu");
      if (!res.ok) throw new Error("Failed to fetch menu items");
      const data = await res.json();
      setMenuItems(data.menuItems || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load menu items. Make sure you are logged in as a vendor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setImagePreview("");
    reset({
      name: "",
      description: "",
      price: "",
      category: "Pizza",
      isAvailable: true,
      variants: [],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setImagePreview(item.imageUrl || "");
    reset({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      variants: item.variants || [],
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImagePreview(data.url);
        setValue("imageUrl", data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Image upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const url = editingItem
        ? `/api/vendor/menu/${editingItem._id}`
        : "/api/vendor/menu";
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        ...data,
        imageUrl: imagePreview,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save menu item");
      }

      setShowModal(false);
      fetchMenu();
      toast.success(editingItem ? "Menu item updated!" : "Menu item added!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/menu/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete menu item");
      }

      fetchMenu();
      toast.success("Menu item deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not delete item.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const res = await fetch(`/api/vendor/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });

      if (!res.ok) throw new Error("Failed to update availability");
      fetchMenu();
      toast.success("Availability updated!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating item status.");
    }
  };

  if (loading && menuItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 w-full animate-pulse rounded bg-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black">Manage Menu</h1>
          <p className="mt-2 text-neutral-500 text-sm">
            Create, edit, and control availability of dishes in your restaurant menu.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-sm px-5 py-3 cursor-pointer"
        >
          + Add Menu Item
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {menuItems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl">
          <span className="text-4xl">🍕</span>
          <h3 className="mt-4 text-lg font-bold text-black">Your Menu is Empty</h3>
          <p className="mt-1 text-sm text-neutral-500">Get started by adding your first menu item.</p>
          <Button
            onClick={handleOpenAddModal}
            className="mt-6 rounded-xl bg-amber-500 text-white font-bold"
          >
            Add Menu Item
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden border border-neutral-100 rounded-2xl shadow-soft">
          <table className="min-w-full divide-y divide-neutral-100 text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="py-4 px-6">Item</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Variants</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {menuItems.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop"}
                      alt={item.name}
                      className="h-10 w-10 rounded-xl object-cover bg-neutral-50"
                    />
                    <div>
                      <span className="font-bold text-black block">{item.name}</span>
                      <span className="text-xs text-neutral-400 line-clamp-1 max-w-xs">
                        {item.description}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-neutral-800">{item.category}</td>
                  <td className="py-4 px-6 font-bold text-black">${item.price.toFixed(2)}</td>
                  <td className="py-4 px-6 text-xs">
                    {item.variants && item.variants.length > 0 ? (
                      <div className="space-y-0.5">
                        {item.variants.map((v) => (
                          <span key={v.name} className="block text-neutral-500">
                            {v.name} (+${v.priceModifier})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-neutral-400">None</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                        item.isAvailable
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Menu Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 my-8">
            <h3 className="text-lg font-bold text-black mb-1">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Enter dish details below. Variants allow modifiers like sizing options.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Pepperoni Pizza"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="12.99"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register("price", { required: "Price is required" })}
                  />
                  {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Category</label>
                  <select
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    {...register("category")}
                  >
                    <option value="Pizza">Pizza</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Italian">Italian</option>
                    <option value="Asian">Asian</option>
                    <option value="Sides">Sides</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-black hover:file:bg-neutral-200"
                  />
                  {uploadingImage && <p className="text-xs text-amber-600 mt-1">Uploading...</p>}
                </div>
              </div>

              {imagePreview && (
                <div className="mt-2 text-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 mx-auto rounded-xl object-cover border border-neutral-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Description</label>
                <textarea
                  placeholder="Tell customers what is in the dish..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 h-20"
                  {...register("description")}
                />
              </div>

              {/* Variants Dynamic Fields */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide">
                    Dish Variants / Sizing Options
                  </h4>
                  <button
                    type="button"
                    onClick={() => append({ name: "", priceModifier: "" })}
                    className="text-xs font-bold text-amber-600 hover:text-amber-500"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. Large 12''"
                        className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 focus:outline-none"
                        {...register(`variants.${index}.name`, { required: true })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price Modifier (+5.00)"
                        className="w-36 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 focus:outline-none"
                        {...register(`variants.${index}.priceModifier`)}
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-500 px-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 text-sm font-semibold border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-6 py-2 text-white transition-colors cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
