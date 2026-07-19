"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

// Public links shown to guests
const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/browse", label: "Browse Food" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  // Prevent hydration mismatch: don't render auth-dependent UI until mounted on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const getRoleLinks = () => {
    if (!user) return PUBLIC_LINKS;
    switch (user.role) {
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard" },
          { href: "/admin/vendors", label: "Vendors" },
          { href: "/admin/customers", label: "Customers" },
          { href: "/admin/orders", label: "All Orders" },
          { href: "/admin/coupons", label: "Coupons" },
        ];
      case "vendor":
        return [
          { href: "/vendor/dashboard", label: "Dashboard" },
          { href: "/vendor/menu", label: "My Menu" },
          { href: "/vendor/orders", label: "Orders" },
        ];
      case "rider":
        return [
          { href: "/rider/dashboard", label: "Rider Panel" },
          { href: "/rider/history", label: "Deliveries" },
        ];
      default:
        return [
          { href: "/", label: "Home" },
          { href: "/restaurants", label: "Restaurants" },
          { href: "/browse", label: "Browse Food" },
          { href: "/orders", label: "My Orders" },
          { href: "/cart", label: "🛒 Cart" },
          { href: "/about", label: "About" },
          { href: "/contact", label: "Contact" },
        ];
    }
  };

  // Always use PUBLIC_LINKS until client is mounted to avoid hydration mismatch
  const navLinks = mounted ? getRoleLinks() : PUBLIC_LINKS;

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-black shrink-0">
            Food<span className="text-amber-500">Mart</span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Show skeleton until mounted to avoid hydration mismatch */}
          {!mounted || loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-200" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="text-sm font-bold text-black leading-none">{user.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mt-0.5">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <button
                className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all cursor-pointer"
                onClick={() => router.push("/auth/login")}
              >
                Log in
              </button>
              <button
                className="rounded-xl bg-black text-white hover:bg-neutral-800 px-4 py-2 text-sm font-semibold transition-all cursor-pointer"
                onClick={() => router.push("/auth/signup")}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
