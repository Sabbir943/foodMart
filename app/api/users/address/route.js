import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import User from "@/models/User.js";
import { getMockUser } from "@/lib/auth-mock.js";

export async function POST(req) {
  try {
    await connectDB();
    const currentUser = await getMockUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, street, city, district, postalCode, instructions } = body;

    if (!label || !street || !city || !district || !postalCode) {
      return NextResponse.json(
        { error: "Label, street, city, district, and postalCode are required fields" },
        { status: 400 }
      );
    }

    const newAddress = {
      label,
      street,
      city,
      district,
      postalCode,
      instructions: instructions || "",
    };

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      { $push: { addresses: newAddress } },
      { new: true }
    );

    return NextResponse.json({
      message: "Address added successfully",
      addresses: updatedUser.addresses,
    });
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json(
      { error: "Failed to add address" },
      { status: 500 }
    );
  }
}
