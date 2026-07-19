"use client";

/**
 * hooks/useAuth.js
 *
 * Provides a global auth context:
 *   const { user, loading, refetch, logout } = useAuth()
 *
 * - user: the currently logged-in user object (or null)
 * - loading: true while the initial session fetch is in flight
 * - refetch(): manually re-fetch the session (call after login/signup)
 * - logout(): clear session and redirect to /auth/login
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast.success("You've been logged out. See you soon!");
    } catch {
      // ignore network errors — still log out locally
    }
    setUser(null);
    router.push("/auth/login");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refetch: fetchSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
