/**
 * lib/auth.js — Better Auth server instance
 *
 * Single source of truth for authentication.
 * Exports:
 *  getAuth()         — lazy-init Better Auth server instance
 *  hashPassword()    — bcrypt hash (used in custom signup)
 *  comparePassword() — bcrypt compare
 *
 * NOTE: We reuse the native MongoDB client that Mongoose manages under the
 * hood via mongoose.connection.getClient(), so we never open a second
 * connection pool to the same database.
 */

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./db.js";

// ─── bcrypt helpers ───────────────────────────────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── Better Auth singleton ────────────────────────────────────────────────────
let _auth = null;

export async function getAuth() {
  if (_auth) return _auth;

  // Ensure Mongoose is connected; reuse its underlying MongoClient so we only
  // ever have ONE connection pool open to MongoDB.
  await connectDB();

  const nativeClient = mongoose.connection.getClient();
  const db = nativeClient.db();

  _auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL:
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:3000",
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    session: {
      cookieCache: { enabled: true, maxAge: 300 },
    },
    plugins: [nextCookies()],
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
