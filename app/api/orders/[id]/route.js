import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/models/Order.js";
import Restaurant from "@/models/Restaurant.js";
import MenuItem from "@/models/MenuItem.js";
import Review from "@/models/Review.js";
import { getMockUser } from "@/lib/auth-mock.js";
import mongoose from "mongoose";

export async function GET(req, { params }) {
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
    })
      .populate("restaurantId")
      .populate("items.menuItemId");

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this order
    const review = await Review.findOne({ orderId: order._id });
    const hasReviewed = !!review;

    // Convert mongoose document to plain object to attach custom fields if needed
    const orderObj = order.toObject();

    return NextResponse.json({
      order: orderObj,
      hasReviewed,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
