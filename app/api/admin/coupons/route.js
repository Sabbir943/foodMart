import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Coupon from "@/models/Coupon.js";
import { getMockAdmin } from "@/lib/auth-mock.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Admin coupons GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, discountType, discountValue, minOrderAmount, expiryDate, isActive } = body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return NextResponse.json(
        { error: "Code, discountType, discountValue, and expiryDate are required fields" },
        { status: 400 }
      );
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      expiryDate: new Date(expiryDate),
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ message: "Coupon created successfully", coupon });
  } catch (error) {
    console.error("Admin coupons POST error:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, code, discountType, discountValue, minOrderAmount, expiryDate, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (code) {
      const codeUpper = code.toUpperCase().trim();
      if (codeUpper !== coupon.code) {
        const existing = await Coupon.findOne({ code: codeUpper });
        if (existing) {
          return NextResponse.json(
            { error: "A coupon with this code already exists" },
            { status: 400 }
          );
        }
        coupon.code = codeUpper;
      }
    }

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    return NextResponse.json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    console.error("Admin coupons PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Coupon deleted successfully", success: true });
  } catch (error) {
    console.error("Admin coupons DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
