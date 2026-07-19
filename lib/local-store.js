/**
 * lib/local-store.js
 *
 * A simple JSON-file-based user store that acts as a fallback
 * when MongoDB is unavailable (e.g., no local MongoDB running).
 *
 * Data is persisted to: .next/local-users.json
 * (inside .next so it's gitignored automatically)
 */

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const DATA_PATH = path.join(process.cwd(), ".next", "local-users.json");

function readStore() {
  try {
    if (!fs.existsSync(DATA_PATH)) return { users: [] };
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return { users: [] };
  }
}

function writeStore(data) {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Ignore write errors — data is lost on restart, but app doesn't crash
  }
}

export const localStore = {
  findByEmail(email) {
    const { users } = readStore();
    return users.find((u) => u.email === email.toLowerCase()) || null;
  },

  findById(id) {
    const { users } = readStore();
    return users.find((u) => u._id === id) || null;
  },

  create(userData) {
    const store = readStore();
    const user = {
      _id: nanoid(24),
      ...userData,
      email: userData.email.toLowerCase(),
      isBlocked: false,
      addresses: [],
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    writeStore(store);
    return user;
  },

  emailExists(email) {
    const { users } = readStore();
    return users.some((u) => u.email === email.toLowerCase());
  },
};
