import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/models/Order.js";
import Restaurant from "@/models/Restaurant.js";
import { getMockVendor } from "@/lib/auth-mock.js";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const vendorUser = await getMockVendor();
    if (!vendorUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await Restaurant.findOne({ ownerId: vendorUser._id });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const order = await Order.findOne({ _id: id, restaurantId: restaurant._id });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, isReadyForPickup, cancelReason } = body;

    // 1. If updating isReadyForPickup
    if (isReadyForPickup !== undefined) {
      order.isReadyForPickup = !!isReadyForPickup;
    }

    // 2. If updating status
    if (status) {
      const allowedVendorStatuses = ["confirmed", "preparing", "cancelled"];
      if (!allowedVendorStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status update for vendor: '${status}'` },
          { status: 400 }
        );
      }

      // Check transitions
      if (status === "confirmed" && order.status !== "placed") {
        return NextResponse.json({ error: "Can only accept 'placed' orders" }, { status: 400 });
      }
      if (status === "preparing" && order.status !== "confirmed") {
        return NextResponse.json({ error: "Can only start preparation on 'confirmed' orders" }, { status: 400 });
      }

      order.status = status;
      order.statusTimestamps = {
        ...order.statusTimestamps,
        [status]: new Date(),
      };
    }

    await order.save();

    return NextResponse.json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating vendor order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
