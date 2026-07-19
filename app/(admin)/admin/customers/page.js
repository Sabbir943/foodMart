"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load customers list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchCustomers();
    });
    return () => {
      active = false;
    };
  }, []);

  const handleToggleBlock = async (userId, currentBlockedState) => {
    const nextState = !currentBlockedState;
    const actionText = nextState ? "block" : "unblock";
    const confirmation = window.confirm(`Are you sure you want to ${actionText} this customer?`);
    if (!confirmation) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBlocked: nextState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update customer status");

      toast.success(data.message || "Customer status updated successfully");
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-6 bg-white min-h-[80vh]">
        <div className="h-10 w-48 animate-pulse rounded bg-neutral-200" />
        <Card className="h-96 w-full animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 bg-white min-h-screen">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Consumers</span>
        <h1 className="text-3xl font-black text-black mt-1">Manage Customers</h1>
        <p className="text-xs text-neutral-500 mt-1">View consumer accounts and manage access permissions.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table Card */}
      <Card className="shadow-soft rounded-3xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-neutral-400">
                    No customers registered yet.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-black">{cust.name}</td>
                    <td className="px-6 py-4 text-neutral-600">{cust.email}</td>
                    <td className="px-6 py-4 text-neutral-500">{cust.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          cust.isBlocked
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {cust.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleToggleBlock(cust._id, cust.isBlocked)}
                        className={`rounded-xl font-bold text-xs px-4 py-1.5 cursor-pointer transition-colors ${
                          cust.isBlocked
                            ? "bg-black text-white hover:bg-neutral-800"
                            : "border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                        }`}
                      >
                        {cust.isBlocked ? "Unblock" : "Block"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
