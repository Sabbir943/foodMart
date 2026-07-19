import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/models/Order.js";
import { getMockAdmin } from "@/lib/auth-mock.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query = {};

    if (status) {
      query.status = status;
    }

    let orders = await Order.find(query)
      .populate("customerId", "name email phone")
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });

    // Client-side filtering in route handler for partial ID matching, customer name, and restaurant name
    if (search) {
      const cleanSearch = search.toLowerCase();
      orders = orders.filter((order) => {
        const orderIdStr = order._id.toString().toLowerCase();
        const customerName = order.customerId?.name?.toLowerCase() || "";
        const restaurantName = order.restaurantId?.name?.toLowerCase() || "";
        
        return (
          orderIdStr.includes(cleanSearch) ||
          customerName.includes(cleanSearch) ||
          restaurantName.includes(cleanSearch)
        );
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
