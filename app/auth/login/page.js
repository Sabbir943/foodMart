"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { user, loading: authLoading, refetch } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role === "admin") window.location.href = "/admin/dashboard";
    else if (user.role === "vendor") window.location.href = "/vendor/dashboard";
    else if (user.role === "rider") window.location.href = "/rider/dashboard";
    else window.location.href = returnTo;
  }, [user, authLoading, returnTo]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);

  // ── Email / Password Sign-In ───────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Login failed");

      toast.success("Welcome back! Signing you in…");

      // Re-fetch session so Navbar updates immediately
      await refetch();

      // Small delay to ensure session cookie is propagated
      await new Promise((r) => setTimeout(r, 500));

      // Hard redirect to ensure session cookie is sent with the request
      const role = result.user.role;
      if (role === "admin") window.location.href = "/admin/dashboard";
      else if (role === "vendor") window.location.href = "/vendor/dashboard";
      else if (role === "rider") window.location.href = "/rider/dashboard";
      else window.location.href = returnTo;
    } catch (err) {
      toast.error(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-tr from-neutral-50 via-white to-orange-50/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-neutral-100 bg-white p-8 shadow-soft-lg transition-transform duration-500 hover:scale-[1.01]">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-3xl font-extrabold tracking-tight text-black">
            Food<span className="text-amber-500">Mart</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in to satisfy your cravings
          </p>
        </div>

        {/* Email / Password Form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                placeholder="you@example.com"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                placeholder="••••••••"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="flex w-full justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-amber-600 hover:text-amber-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center bg-white">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
            <p className="text-sm font-semibold text-neutral-500">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
