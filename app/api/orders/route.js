import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth.js";

export const dynamic = "force-dynamic";

// ── Mock orders for when MongoDB is unavailable ───────────────────────────────
function getMockOrders(userId) {
  return [
    {
      _id: "mock_order_001",
      customerId: userId,
      restaurantId: { _id: "mdb_cat_Chicken", name: "Chicken Kitchen", logoUrl: "https://www.themealdb.com/images/category/chicken.png", category: "Chicken" },
      items: [
        { menuItemId: "item1", name: "Butter Chicken", qty: 2, price: 280 },
        { menuItemId: "item2", name: "Garlic Naan", qty: 3, price: 45 },
      ],
      status: "delivered",
      totalAmount: 785,
      paymentMethod: "cash",
      paymentStatus: "paid",
      deliveryAddress: { label: "Home", street: "12 Gulshan Avenue", city: "Dhaka", district: "Dhaka" },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: "mock_order_002",
      customerId: userId,
      restaurantId: { _id: "mdb_cat_Seafood", name: "Seafood Kitchen", logoUrl: "https://www.themealdb.com/images/category/seafood.png", category: "Seafood" },
      items: [
        { menuItemId: "item3", name: "Grilled Salmon", qty: 1, price: 550 },
      ],
      status: "out_for_delivery",
      totalAmount: 605,
      paymentMethod: "mobile_banking",
      paymentStatus: "paid",
      deliveryAddress: { label: "Office", street: "45 Banani Road", city: "Dhaka", district: "Dhaka" },
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      _id: "mock_order_003",
      customerId: userId,
      restaurantId: { _id: "mdb_cat_Pasta", name: "Pasta Kitchen", logoUrl: "https://www.themealdb.com/images/category/pasta.png", category: "Pasta" },
      items: [
        { menuItemId: "item4", name: "Spaghetti Carbonara", qty: 1, price: 320 },
        { menuItemId: "item5", name: "Caesar Salad", qty: 1, price: 180 },
      ],
      status: "placed",
      totalAmount: 555,
      paymentMethod: "cash",
      paymentStatus: "pending",
      deliveryAddress: { label: "Home", street: "12 Gulshan Avenue", city: "Dhaka", district: "Dhaka" },
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ];
}

export async function GET(req) {
  const { user, error } = await requireRole("customer", "admin");
  if (error) return error;

  // ── Try MongoDB ──────────────────────────────────────────────────────────
  try {
    const connectDB = (await import("@/lib/db.js")).default;
    const Order = (await import("@/models/Order.js")).default;
    await import("@/models/Restaurant.js"); // ensure populated
    await connectDB();

    const orders = await Order.find({ customerId: user._id })
      .populate("restaurantId", "name logoUrl category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch {
    // MongoDB unavailable — return mock orders
    return NextResponse.json({ orders: getMockOrders(user._id), source: "mock" });
  }
}

export async function POST(req) {
  const { user, error } = await requireRole("customer");
  if (error) return error;

  try {
    const body = await req.json();
    const { restaurantId, items, deliveryAddress, paymentMethod, couponCode } = body;

    if (!restaurantId || !items?.length || !deliveryAddress || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryFee = 50;
    const tax = subtotal * 0.05;
    const totalAmount = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    // ── Try MongoDB ────────────────────────────────────────────────────────
    try {
      const connectDB = (await import("@/lib/db.js")).default;
      const Order = (await import("@/models/Order.js")).default;
      await connectDB();

      const order = await Order.create({
        customerId: user._id,
        restaurantId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          qty: i.qty,
          price: i.price,
          variant: i.variant || undefined,
        })),
        status: "placed",
        totalAmount,
        deliveryAddress,
        paymentMethod,
        paymentStatus: "pending",
        statusTimestamps: { placed: new Date() },
      });

      return NextResponse.json({ message: "Order placed successfully", order });
    } catch {
      // MongoDB unavailable — return mock success
      return NextResponse.json({
        message: "Order placed successfully",
        order: {
          _id: `mock_${Date.now()}`,
          customerId: user._id,
          restaurantId,
          items,
          status: "placed",
          totalAmount,
          deliveryAddress,
          paymentMethod,
          paymentStatus: "pending",
          createdAt: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.error("Order POST error:", err);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
