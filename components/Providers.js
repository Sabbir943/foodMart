"use client";

import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "12px",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            },
            success: {
              iconTheme: {
                primary: "#f59e0b",
                secondary: "#1a1a1a",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              style: {
                background: "#1a1a1a",
                color: "#fff",
              },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
