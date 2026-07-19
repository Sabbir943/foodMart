import { NextResponse } from "next/server";

const JWT_SECRET = process.env.BETTER_AUTH_SECRET || "supersecretbetterauthsecret12345";

// Helper to convert base64url signature to ArrayBuffer
function base64urlToArrayBuffer(base64url) {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Web Crypto HMAC-SHA256 Verification helper
async function verifyTokenWeb(token, secret) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [base64Header, base64Payload, signature] = parts;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(`${base64Header}.${base64Payload}`);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBuf = base64urlToArrayBuffer(signature);
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBuf, data);
    if (!isValid) return null;

    const decodedPayload = JSON.parse(
      new TextDecoder().decode(base64urlToArrayBuffer(base64Payload))
    );

    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }

    return decodedPayload;
  } catch (err) {
    console.error("Proxy token verification error:", err);
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Define route prefixes we want to protect
  const isAdminRoute = pathname.startsWith("/admin");
  const isVendorRoute = pathname.startsWith("/vendor");
  const isRiderRoute = pathname.startsWith("/rider");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isAdminRoute || isVendorRoute || isRiderRoute || isDashboardRoute) {
    const token = request.cookies.get("token")?.value;
    const payload = await verifyTokenWeb(token, JWT_SECRET);

    if (!payload) {
      // Not logged in or invalid token
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }

    // Role-based authorization check
    if (isAdminRoute && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isVendorRoute && payload.role !== "vendor") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isRiderRoute && payload.role !== "rider") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/rider/:path*",
    "/dashboard/:path*",
  ],
};
