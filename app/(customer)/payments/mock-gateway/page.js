"use client";

import { useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "@heroui/react";

function MockGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method") || "card";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePaymentResult = async (status) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/payments/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update payment");
      }

      if (status === "success") {
        router.push(`/orders/${orderId}/track`);
      } else {
        router.push(`/orders/${orderId}/track?paymentFailed=true`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during payment simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-neutral-900 text-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-neutral-950 p-8 border border-neutral-800 shadow-2xl text-center">
        <div>
          <span className="text-4xl">🔐</span>
          <h2 className="mt-4 text-xl font-bold tracking-tight">FoodMart SafePay Gateway</h2>
          <p className="mt-1 text-xs text-neutral-400">
            Simulating secure transaction for Order <strong className="text-white">#{orderId?.substring(orderId.length - 8).toUpperCase()}</strong>
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-900 p-4 border border-neutral-800 space-y-2 text-sm text-neutral-300">
          <div className="flex justify-between">
            <span>Payment Method</span>
            <span className="font-bold text-white uppercase">{method.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span>Gateway status</span>
            <span className="text-yellow-500 font-bold">Awaiting Input</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500 bg-red-950/30 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            disabled={loading}
            onClick={() => handlePaymentResult("success")}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : "Simulate Success (Paid)"}
          </Button>

          <Button
            disabled={loading}
            onClick={() => handlePaymentResult("failure")}
            className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : "Simulate Failure (Failed)"}
          </Button>

          <Button
            disabled={loading}
            onClick={() => router.push("/checkout")}
            className="w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 cursor-pointer disabled:opacity-50"
          >
            Cancel & Return
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-neutral-500">
        Loading gateway simulator...
      </div>
    }>
      <MockGatewayContent />
    </Suspense>
  );
}
