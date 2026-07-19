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

    const order = await Order.findOne({ _id: id, riderId: riderProfile._id });
    if (!order) {
      return NextResponse.json({ error: "Active order not found for this rider" }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const allowedRiderStatuses = ["picked_up", "delivered"];
    if (!allowedRiderStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status transition for rider" },
        { status: 400 }
      );
    }

    if (status === "picked_up") {
      if (order.status !== "preparing") {
        return NextResponse.json(
          { error: "Order must be in preparing status to mark as picked up" },
          { status: 400 }
        );
      }
      order.status = "out_for_delivery";
      order.statusTimestamps = {
        ...order.statusTimestamps,
        out_for_delivery: new Date(),
      };
    } else if (status === "delivered") {
      if (order.status !== "out_for_delivery") {
        return NextResponse.json(
          { error: "Order must be out for delivery to mark as delivered" },
          { status: 400 }
        );
      }
      order.status = "delivered";
      order.paymentStatus = "paid"; // payment complete upon delivery
      order.statusTimestamps = {
        ...order.statusTimestamps,
        delivered: new Date(),
      };
    }

    await order.save();

    return NextResponse.json({
      message: `Order status updated to '${order.status}'`,
      order,
    });
  } catch (error) {
    console.error("Error updating rider delivery status:", error);
    return NextResponse.json(
      { error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}
