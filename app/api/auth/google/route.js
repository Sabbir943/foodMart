import { NextResponse } from "next/server";

/**
 * Google OAuth is now handled by better-auth via:
 *   GET /api/auth/sign-in/social?provider=google&callbackURL=/
 *
 * This route is kept for backwards-compatibility but redirects to the
 * proper better-auth endpoint.
 *
 * To enable Google OAuth, add these to your .env:
 *   GOOGLE_CLIENT_ID=your_client_id_here
 *   GOOGLE_CLIENT_SECRET=your_client_secret_here
 *
 * Then create credentials at: https://console.cloud.google.com/
 * Authorised redirect URI: http://localhost:3000/api/auth/callback/google
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const callbackURL = searchParams.get("callbackURL") || "/";
  return NextResponse.redirect(
    new URL(
      `/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(callbackURL)}`,
      req.url
    )
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Google OAuth is now handled by better-auth. Navigate to /api/auth/sign-in/social?provider=google to initiate the flow.",
    },
    { status: 400 }
  );
}
