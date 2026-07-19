import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/models/Order.js";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (status === "success") {
      order.paymentStatus = "paid";
      // Auto-confirm paid orders
      order.status = "confirmed";
      order.statusTimestamps = {
        ...order.statusTimestamps,
        confirmed: new Date(),
      };
    } else if (status === "failure") {
      order.paymentStatus = "failed";
    }

    await order.save();

    return NextResponse.json({
      message: `Payment status updated to ${order.paymentStatus}`,
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
