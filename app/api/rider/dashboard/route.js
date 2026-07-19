import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

const MOCK_RIDER = {
  _id: "mock_rider_001",
  isAvailable: true,
  vehicleType: "motorcycle",
  rating: 4.8,
  totalDeliveries: 142,
  earningsToday: 1240,
};

const MOCK_AVAILABLE_ORDERS = [
  {
    _id: "mock_avail_001",
    restaurantId: {
      _id: "mdb_cat_Chicken",
      name: "Chicken Kitchen",
      address: { street: "48 Gulshan Avenue", city: "Dhaka" },
    },
    deliveryAddress: { street: "12 Banani Road", city: "Dhaka" },
    totalAmount: 640,
    items: [{ qty: 2, price: 280 }, { qty: 1, price: 80 }],
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    _id: "mock_avail_002",
    restaurantId: {
      _id: "mdb_cat_Pasta",
      name: "Pasta Kitchen",
      address: { street: "22 Dhanmondi Road", city: "Dhaka" },
    },
    deliveryAddress: { street: "5 Mirpur Road", city: "Dhaka" },
    totalAmount: 380,
    items: [{ qty: 1, price: 320 }],
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];

export async function GET(req) {
  const { user, error } = await requireRole("rider", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Rider = (await import("@/models/Rider.js")).default;
    const Order = (await import("@/models/Order.js")).default;
    await import("@/models/Restaurant.js");
    await connectDB();

    const riderProfile = await Rider.findOne({ userId: user._id }).lean();
    if (!riderProfile) {
      // No rider profile yet — return mock with user name
      return NextResponse.json({
        rider: { ...MOCK_RIDER, name: user.name || "Rider" },
        activeOrder: null,
        availableOrders: MOCK_AVAILABLE_ORDERS,
        source: "mock",
      });
    }

    const [activeOrder, availableOrders] = await Promise.all([
      Order.findOne({
        riderId: riderProfile._id,
        status: { $in: ["confirmed", "preparing", "out_for_delivery"] },
      }).populate("restaurantId").lean(),
      riderProfile.isAvailable
        ? Order.find({
            status: "preparing",
            isReadyForPickup: true,
            $or: [{ riderId: null }, { riderId: { $exists: false } }],
          }).populate("restaurantId").sort({ createdAt: 1 }).lean()
        : [],
    ]);

    return NextResponse.json({
      rider: {
        _id: riderProfile._id.toString(),
        isAvailable: riderProfile.isAvailable,
        vehicleType: riderProfile.vehicleType,
        rating: riderProfile.rating,
        name: user.name,
      },
      activeOrder,
      availableOrders,
    });
  } catch {
    // DB unavailable — return mock dashboard
    return NextResponse.json({
      rider: { ...MOCK_RIDER, name: user.name || "Rider" },
      activeOrder: null,
      availableOrders: MOCK_AVAILABLE_ORDERS,
      source: "mock",
    });
  }
}
