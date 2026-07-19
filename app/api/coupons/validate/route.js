import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Coupon from "@/models/Coupon.js";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code || subtotal === undefined) {
      return NextResponse.json(
        { error: "Coupon code and subtotal are required fields" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code or coupon is inactive" },
        { status: 404 }
      );
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    // Check min order amount
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount of $${coupon.minOrderAmount.toFixed(
            2
          )} required to use this coupon`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Coupon validated successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
