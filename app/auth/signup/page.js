"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role }),
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Signup failed");

      toast.success("Account created! Please log in.");

      // Redirect to login for all roles
      setTimeout(() => {
        router.push("/auth/login");
        router.refresh();
      }, 800);
    } catch (err) {
      toast.error(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const roleTabClass = (r) =>
    `flex-1 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
      role === r
        ? "bg-white text-black shadow-sm"
        : "text-neutral-500 hover:text-black"
    }`;

  const inputClass =
    "mt-1 block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm";

  return (
    <div className="flex min-h-[90vh] items-center justify-center bg-gradient-to-tr from-neutral-50 via-white to-amber-50/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-neutral-100 bg-white p-8 shadow-soft-lg transition-transform duration-500 hover:scale-[1.01]">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-3xl font-extrabold tracking-tight text-black">
            Food<span className="text-amber-500">Mart</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">Create an Account</h1>
          <p className="mt-2 text-sm text-neutral-500">Join the FoodMart family today</p>
        </div>

        {/* Role Tabs */}
        <div className="flex rounded-xl bg-neutral-100 p-1">
          <button type="button" onClick={() => setRole("customer")} className={roleTabClass("customer")}>
            Customer
          </button>
          <button type="button" onClick={() => setRole("vendor")} className={roleTabClass("vendor")}>
            Vendor / Restaurant
          </button>
          <button type="button" onClick={() => setRole("rider")} className={roleTabClass("rider")}>
            Delivery Rider
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={inputClass}
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password + Confirm */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" },
                  })}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (v) => v === password || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Vendor-specific fields */}
            {role === "vendor" && (
              <div className="space-y-4 border-t border-neutral-100 pt-4 animate-fade-in">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
                  Restaurant Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Restaurant Name</label>
                    <input
                      type="text"
                      placeholder="Pizza House"
                      className={inputClass}
                      {...register("restaurantName", { required: "Restaurant name is required" })}
                    />
                    {errors.restaurantName && (
                      <p className="mt-1 text-xs text-red-600">{errors.restaurantName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Category / Cuisine</label>
                    <select className={inputClass} {...register("restaurantCategory")}>
                      <option value="Italian">Italian</option>
                      <option value="Fast Food">Fast Food</option>
                      <option value="Burgers">Burgers</option>
                      <option value="Desi / Bengali">Desi / Bengali</option>
                      <option value="Asian">Asian</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Restaurant Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/restaurant.jpg"
                    className={inputClass}
                    {...register("restaurantImageUrl")}
                  />
                  <p className="mt-1 text-[10px] text-neutral-400">Paste a URL for your restaurant cover image</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Address</label>
                  <input
                    type="text"
                    placeholder="79 Gulshan Avenue, Dhaka"
                    className={inputClass}
                    {...register("restaurantAddress", { required: "Address is required" })}
                  />
                  {errors.restaurantAddress && (
                    <p className="mt-1 text-xs text-red-600">{errors.restaurantAddress.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Rider-specific fields */}
            {role === "rider" && (
              <div className="space-y-4 border-t border-neutral-100 pt-4 animate-fade-in">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
                  Rider Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Vehicle Type</label>
                  <select className={inputClass} {...register("vehicleType")}>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            id="signup-submit-btn"
            disabled={loading}
            className="flex w-full justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account…
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-amber-600 hover:text-amber-500 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
