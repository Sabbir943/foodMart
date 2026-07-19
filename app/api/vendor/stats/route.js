import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

const MOCK_STATS = {
  todayOrdersCount: 14,
  todayRevenue: 8240,
  pendingOrdersCount: 3,
  readyOrdersCount: 2,
  totalMenuItems: 24,
  restaurantRating: 4.7,
};

const MOCK_RESTAURANT = {
  _id: "mock_restaurant_001",
  name: "Your Kitchen",
  category: "General",
  isOpen: true,
  rating: 4.7,
  logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&fit=crop",
};

export async function GET(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Order = (await import("@/models/Order.js")).default;
    const Restaurant = (await import("@/models/Restaurant.js")).default;
    await connectDB();

    const restaurant = await Restaurant.findOne({ ownerId: user._id }).lean();
    if (!restaurant) {
      return NextResponse.json({ stats: MOCK_STATS, restaurant: MOCK_RESTAURANT, source: "mock" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrdersCount, revenueResult, pendingOrdersCount, readyOrdersCount] = await Promise.all([
      Order.countDocuments({ restaurantId: restaurant._id, createdAt: { $gte: startOfDay } }),
      Order.aggregate([{
        $match: { restaurantId: restaurant._id, status: "delivered", createdAt: { $gte: startOfDay } },
      }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.countDocuments({
        restaurantId: restaurant._id,
        status: { $in: ["placed", "confirmed", "preparing"] },
        isReadyForPickup: { $ne: true },
      }),
      Order.countDocuments({
        restaurantId: restaurant._id,
        status: "preparing",
        isReadyForPickup: true,
      }),
    ]);

    return NextResponse.json({
      stats: {
        todayOrdersCount,
        todayRevenue: revenueResult[0]?.total || 0,
        pendingOrdersCount,
        readyOrdersCount,
      },
      restaurant,
    });
  } catch {
    return NextResponse.json({ stats: MOCK_STATS, restaurant: MOCK_RESTAURANT, source: "mock" });
  }
}
