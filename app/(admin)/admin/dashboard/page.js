"use client";

import { useState, useEffect } from "react";
import { Card } from "@heroui/react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load statistics");
      const data = await res.json();
      setStats(data.stats);
      setChartData(data.chartData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard data. Ensure you have admin access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchStats();
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 bg-white min-h-[80vh]">
        <div className="h-10 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 border border-neutral-100 shadow-soft">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 mb-2" />
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200" />
            </Card>
          ))}
        </div>
        <Card className="h-72 w-full animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-white min-h-[80vh]">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Find max value in chart data to scale bars
  const maxCount = Math.max(...chartData.map((d) => d.count), 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 bg-white min-h-screen">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">System Overview</span>
        <h1 className="text-3xl font-black text-black mt-1">Admin Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">Real-time statistics and metrics across the platform.</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 flex flex-col justify-between hover:shadow-soft-lg transition-all duration-300">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Total Revenue</span>
            <strong className="text-3xl font-black text-black mt-2 block">
              ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : "0.00"}
            </strong>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full self-start mt-4">
            Delivered Orders
          </span>
        </Card>

        {/* Total Orders */}
        <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 flex flex-col justify-between hover:shadow-soft-lg transition-all duration-300">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Total Orders</span>
            <strong className="text-3xl font-black text-black mt-2 block">
              {stats?.totalOrders || 0}
            </strong>
          </div>
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full self-start mt-4">
            Platform Transactions
          </span>
        </Card>

        {/* Active Vendors */}
        <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 flex flex-col justify-between hover:shadow-soft-lg transition-all duration-300">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Active Vendors</span>
            <strong className="text-3xl font-black text-black mt-2 block">
              {stats?.activeVendors || 0}
            </strong>
          </div>
          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full self-start mt-4">
            Approved Restaurants
          </span>
        </Card>

        {/* Active Customers */}
        <Card className="shadow-soft rounded-2xl border border-neutral-100 p-6 flex flex-col justify-between hover:shadow-soft-lg transition-all duration-300">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Active Customers</span>
            <strong className="text-3xl font-black text-black mt-2 block">
              {stats?.activeCustomers || 0}
            </strong>
          </div>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full self-start mt-4">
            Registered Consumers
          </span>
        </Card>
      </div>

      {/* SVG Chart Section */}
      <Card className="shadow-soft rounded-3xl border border-neutral-100 p-8">
        <h3 className="text-lg font-black text-black mb-1">Weekly Transaction Volume</h3>
        <p className="text-xs text-neutral-500 mb-8">Daily order count comparison for the last 7 days.</p>

        {/* SVG Wrapper */}
        <div className="relative w-full overflow-x-auto pb-4">
          <div className="min-w-[600px] h-64 flex flex-col justify-between">
            {/* Chart Area */}
            <div className="flex-1 flex items-end justify-between px-4 border-b border-neutral-200 pb-2 relative h-48">
              {chartData.map((d) => {
                const percentage = (d.count / maxCount) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative z-10 mx-2">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] font-bold rounded-lg px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-20 text-center whitespace-nowrap">
                      <div>{d.count} orders</div>
                      <div className="text-amber-500">${d.revenue.toFixed(2)}</div>
                    </div>
                    
                    {/* Bar */}
                    <div 
                      style={{ height: `${percentage}%` }}
                      className="w-12 bg-neutral-900 rounded-t-xl hover:bg-amber-500 transition-all duration-300 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels Area */}
            <div className="flex justify-between px-4 pt-2">
              {chartData.map((d) => (
                <div key={d.date} className="flex-1 text-center">
                  <span className="text-xs font-bold text-neutral-500 block">{d.dayName}</span>
                  <span className="text-[10px] text-neutral-400">{d.date.substring(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
