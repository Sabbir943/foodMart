import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Review from "@/models/Review.js";
import Order from "@/models/Order.js";
import Restaurant from "@/models/Restaurant.js";
import { getMockUser } from "@/lib/auth-mock.js";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await getMockUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, restaurantRating, riderRating, comment } = body;

    // Validate request
    if (!orderId || !restaurantRating) {
      return NextResponse.json(
        { error: "Missing required fields: orderId and restaurantRating are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      customerId: currentUser._id,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "You can only review delivered orders" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this order" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await Review.create({
      orderId: order._id,
      customerId: currentUser._id,
      restaurantId: order.restaurantId,
      riderId: order.riderId || undefined,
      restaurantRating: Number(restaurantRating),
      riderRating: riderRating ? Number(riderRating) : undefined,
      comment: comment || "",
    });

    // Update restaurant average rating
    const reviews = await Review.find({ restaurantId: order.restaurantId });
    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.restaurantRating, 0) / reviews.length;
      await Restaurant.findByIdAndUpdate(order.restaurantId, {
        rating: Math.round(avgRating * 10) / 10, // round to 1 decimal place
      });
    }

    return NextResponse.json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
