import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/models/Order.js";
import User from "@/models/User.js";
import { getMockAdmin } from "@/lib/auth-mock.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    // Verification check (mock support)
    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Total orders count
    const totalOrders = await Order.countDocuments();

    // 2. Total revenue (sum of delivered/paid orders)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 3. Active vendors count
    const activeVendors = await User.countDocuments({
      role: "vendor",
      isBlocked: false,
    });

    // 4. Active customers count
    const activeCustomers = await User.countDocuments({
      role: "customer",
      isBlocked: false,
    });

    // 5. Weekly stats for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format weekly data for the chart, filling in missing dates
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const match = weeklyOrders.find((w) => w._id === dateStr);
      chartData.push({
        date: dateStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: match ? match.count : 0,
        revenue: match ? parseFloat(match.revenue.toFixed(2)) : 0,
      });
    }

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        activeVendors,
        activeCustomers,
      },
      chartData,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
