import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/models/Order.js";
import { getMockUser } from "@/lib/auth-mock.js";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    const currentUser = await getMockUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const order = await Order.findOne({
      _id: id,
      customerId: currentUser._id,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check status eligibility for cancellation
    const cancellableStatuses = ["placed", "confirmed"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order in '${order.status}' status.` },
        { status: 400 }
      );
    }

    // Update status and timestamps
    order.status = "cancelled";
    order.statusTimestamps = {
      ...order.statusTimestamps,
      cancelled: new Date(),
    };

    await order.save();

    return NextResponse.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
