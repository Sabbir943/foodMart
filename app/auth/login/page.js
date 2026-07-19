"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { refetch } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

      // Redirect based on role
      const role = result.user.role;
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "vendor") router.push("/vendor/dashboard");
      else if (role === "rider") router.push("/rider/dashboard");
      else router.push(returnTo);

      router.refresh();
    } catch (err) {
      toast.error(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth Sign-In ──────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const test = await fetch(
        `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(returnTo)}`,
        { method: "GET", redirect: "manual" }
      );

      if (test.type === "opaqueredirect" || test.status === 302 || test.status === 301) {
        window.location.href = `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(returnTo)}`;
        return;
      }

      if (!test.ok) {
        toast.error("Google OAuth is not configured. Please use email/password.");
        setGoogleLoading(false);
        return;
      }

      window.location.href = `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(returnTo)}`;
    } catch {
      window.location.href = `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(returnTo)}`;
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

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-100" />
          </div>
          <span className="relative bg-white px-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            or continue with
          </span>
        </div>

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 transition-all cursor-pointer group disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
        </button>

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
