import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { getMockAdmin } from "@/lib/auth-mock.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const adminUser = await getMockAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await User.find({ role: "customer" }).select("-passwordHash");
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Admin customers list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
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
    const { userId, isBlocked } = body;

    if (!userId || isBlocked === undefined) {
      return NextResponse.json(
        { error: "User ID and isBlocked are required fields" },
        { status: 400 }
      );
    }

    const customer = await User.findById(userId);
    if (!customer || customer.role !== "customer") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    customer.isBlocked = isBlocked;
    await customer.save();

    const message = isBlocked ? "Customer blocked successfully" : "Customer unblocked successfully";
    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error("Admin customer block error:", error);
    return NextResponse.json(
      { error: "Failed to update customer status" },
      { status: 500 }
    );
  }
}
