import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Rider from "@/models/Rider.js";
import Order from "@/models/Order.js";
import { getMockRider } from "@/lib/auth-mock.js";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const riderUser = await getMockRider();
    if (!riderUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const riderProfile = await Rider.findOne({ userId: riderUser._id });
    if (!riderProfile) {
      return NextResponse.json({ error: "Rider profile not found" }, { status: 404 });
    }

    // Check if the rider already has an active delivery
    const activeOrder = await Order.findOne({
      riderId: riderProfile._id,
      status: { $in: ["confirmed", "preparing", "out_for_delivery"] },
    });

    if (activeOrder) {
      return NextResponse.json(
        { error: "You already have an active delivery. Complete it first." },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.riderId) {
      return NextResponse.json(
        { error: "Order has already been accepted by another rider" },
        { status: 400 }
      );
    }

    if (order.status !== "preparing" || !order.isReadyForPickup) {
      return NextResponse.json(
        { error: "Order is not ready for delivery accept" },
        { status: 400 }
      );
    }

    // Assign rider
    order.riderId = riderProfile._id;
    await order.save();

    return NextResponse.json({
      message: "Order delivery accepted successfully",
      order,
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    return NextResponse.json(
      { error: "Failed to accept order" },
      { status: 500 }
    );
  }
}
