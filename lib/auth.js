/**
 * lib/auth.js — Better Auth server instance
 *
 * Single source of truth for authentication.
 * Exports:
 *  auth            — Better Auth server instance (for API routes)
 *  hashPassword()  — bcrypt hash (used in custom signup)
 *  comparePassword() — bcrypt compare
 */

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

// ─── bcrypt helpers ───────────────────────────────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── Better Auth instance ─────────────────────────────────────────────────────
let _auth = null;
let _mongoClient = null;
let _db = null;

export async function getAuth() {
  if (_auth) return _auth;

  if (!_db) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    _mongoClient = new MongoClient(uri);
    await _mongoClient.connect();
    _db = _mongoClient.db();
  }

  const googleConfig =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {};

  _auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    database: mongodbAdapter(_db),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    socialProviders: googleConfig,
    session: {
      cookieCache: { enabled: true, maxAge: 300 },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "customer",
          input: true,
        },
        isBlocked: {
          type: "boolean",
          defaultValue: false,
          input: false,
        },
      },
    },
  });

  return _auth;
}
