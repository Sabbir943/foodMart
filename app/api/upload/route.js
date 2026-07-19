import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Simulate upload network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockImages = [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&fit=crop",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&fit=crop",
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&fit=crop",
      "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&fit=crop",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&fit=crop",
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&fit=crop",
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];

    return NextResponse.json({
      url: randomImage,
      success: true,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
