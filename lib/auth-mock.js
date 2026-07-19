/**
 * lib/auth-mock.js
 *
 * Removed mock fallbacks. All functions now require a real authenticated session.
 * Returns null if the user is not logged in with the proper role.
 */

import connectDB from "./db.js";
import User from "../models/User.js";
import { getAuthUser } from "./server-auth.js";

/**
 * Gets the logged-in customer from session.
 * Returns null if not authenticated as a customer.
 */
export async function getMockUser() {
  await connectDB();
  const user = await getAuthUser();
  if (user && !user.isBlocked) {
    return user;
  }
  return null;
}

/**
 * Gets the logged-in vendor from session.
 * Returns null if not authenticated as a vendor.
 */
export async function getMockVendor() {
  await connectDB();
  const user = await getAuthUser();
  if (user && !user.isBlocked && user.role === "vendor") {
    return user;
  }
  return null;
}

/**
 * Gets the logged-in rider from session.
 * Returns null if not authenticated as a rider.
 */
export async function getMockRider() {
  await connectDB();
  const user = await getAuthUser();
  if (user && !user.isBlocked && user.role === "rider") {
    return user;
  }
  return null;
}

/**
 * Gets the logged-in admin from session.
 * Returns null if not authenticated as an admin.
 */
export async function getMockAdmin() {
  await connectDB();
  const user = await getAuthUser();
  if (user && !user.isBlocked && user.role === "admin") {
    return user;
  }
  return null;
}
