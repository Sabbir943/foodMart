"use client";

/**
 * lib/auth-client.js
 *
 * Client-side better-auth instance.
 * Import `authClient` in Client Components to call:
 *   - authClient.signIn.email({ email, password })
 *   - authClient.signUp.email({ email, password, name })
 *   - authClient.signOut()
 *   - authClient.useSession()   (React hook)
 */

import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
});

export const { useSession } = authClient;
