import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

function getMockHistory() {
  const now = Date.now();
  return [
    {
      _id: "mock_hist_001",
      restaurantId: { _id: "mdb_cat_Chicken", name: "Chicken Kitchen", address: { street: "48 Gulshan Ave", city: "Dhaka" } },
      deliveryAddress: { street: "12 Banani Road", city: "Dhaka" },
      totalAmount: 640,
      status: "delivered",
      riderEarning: 80,
      riderRating: 5,
      reviewComment: "Super fast delivery!",
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: "mock_hist_002",
      restaurantId: { _id: "mdb_cat_Pasta", name: "Pasta Kitchen", address: { street: "22 Dhanmondi Rd", city: "Dhaka" } },
      deliveryAddress: { street: "5 Mirpur Road", city: "Dhaka" },
      totalAmount: 380,
      status: "delivered",
      riderEarning: 60,
      riderRating: 4,
      reviewComment: "Good service",
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: "mock_hist_003",
      restaurantId: { _id: "mdb_cat_Seafood", name: "Seafood Kitchen", address: { street: "30 Uttara Rd", city: "Dhaka" } },
      deliveryAddress: { street: "7 Pallabi, Mirpur", city: "Dhaka" },
      totalAmount: 820,
      status: "delivered",
      riderEarning: 100,
      riderRating: 5,
      reviewComment: null,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function GET(req) {
  const { user, error } = await requireRole("rider", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Rider = (await import("@/models/Rider.js")).default;
    const Order = (await import("@/models/Order.js")).default;
    const Review = (await import("@/models/Review.js")).default;
    await import("@/models/Restaurant.js");
    await connectDB();

    const riderProfile = await Rider.findOne({ userId: user._id }).lean();
    if (!riderProfile) {
      return NextResponse.json({ history: getMockHistory(), source: "mock" });
    }

    const orders = await Order.find({ riderId: riderProfile._id, status: "delivered" })
      .populate("restaurantId", "name address")
      .sort({ createdAt: -1 })
      .lean();

    const orderIds = orders.map((o) => o._id);
    const reviews = await Review.find({ orderId: { $in: orderIds } }).lean();

    const history = orders.map((order) => {
      const review = reviews.find((r) => r.orderId.toString() === order._id.toString());
      return { ...order, riderRating: review?.riderRating || null, reviewComment: review?.comment || null };
    });

    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ history: getMockHistory(), source: "mock" });
  }
}
