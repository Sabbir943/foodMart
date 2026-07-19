import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

function getMockOrders(restaurantId) {
  const now = Date.now();
  return [
    {
      _id: "mock_vorder_001",
      restaurantId,
      customerId: { _id: "c1", name: "Arif Ahmed", email: "arif@example.com", phone: "01711111111" },
      items: [
        { menuItemId: { name: "Butter Chicken", price: 280 }, qty: 2, price: 280 },
        { menuItemId: { name: "Garlic Naan", price: 45 }, qty: 3, price: 45 },
      ],
      status: "placed",
      isReadyForPickup: false,
      totalAmount: 785,
      paymentMethod: "cash",
      paymentStatus: "pending",
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      _id: "mock_vorder_002",
      restaurantId,
      customerId: { _id: "c2", name: "Nadia Islam", email: "nadia@example.com", phone: "01822222222" },
      items: [
        { menuItemId: { name: "Chicken Tikka", price: 350 }, qty: 1, price: 350 },
      ],
      status: "preparing",
      isReadyForPickup: true,
      totalAmount: 405,
      paymentMethod: "mobile_banking",
      paymentStatus: "paid",
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      _id: "mock_vorder_003",
      restaurantId,
      customerId: { _id: "c3", name: "Rahim Hossain", email: "rahim@example.com", phone: "01933333333" },
      items: [
        { menuItemId: { name: "Biryani", price: 420 }, qty: 2, price: 420 },
        { menuItemId: { name: "Raita", price: 60 }, qty: 2, price: 60 },
      ],
      status: "delivered",
      isReadyForPickup: false,
      totalAmount: 1010,
      paymentMethod: "cash",
      paymentStatus: "paid",
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function GET(req) {
  const { user, error } = await requireRole("vendor", "admin");
  if (error) return error;

  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Order = (await import("@/models/Order.js")).default;
    const Restaurant = (await import("@/models/Restaurant.js")).default;
    await import("@/models/User.js");
    await import("@/models/MenuItem.js");
    await connectDB();

    const restaurant = await Restaurant.findOne({ ownerId: user._id }).lean();
    if (!restaurant) {
      return NextResponse.json({ orders: getMockOrders("mock_restaurant_001"), source: "mock" });
    }

    const orders = await Order.find({ restaurantId: restaurant._id })
      .populate("customerId", "name email phone")
      .populate("items.menuItemId", "name price category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ orders: getMockOrders("mock_restaurant_001"), source: "mock" });
  }
}
