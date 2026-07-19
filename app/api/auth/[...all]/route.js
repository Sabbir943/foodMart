/**
 * app/api/auth/[...all]/route.js
 *
 * Mounts Better Auth under /api/auth/* to handle:
 *   - POST /api/auth/sign-in/email
 *   - POST /api/auth/sign-up/email
 *   - GET  /api/auth/sign-in/social?provider=google
 *   - GET  /api/auth/callback/google
 *   - POST /api/auth/sign-out
 *   - GET  /api/auth/get-session
 *
 * Custom routes (signup with extra fields, session, logout) take priority
 * because Next.js resolves static routes before this catch-all.
 */

import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

let _handler = null;

async function getHandler() {
  if (_handler) return _handler;
  const auth = await getAuth();
  _handler = toNextJsHandler(auth);
  return _handler;
}

export async function GET(request) {
  const handler = await getHandler();
  return handler.GET(request);
}

export async function POST(request) {
  const handler = await getHandler();
  return handler.POST(request);
}
