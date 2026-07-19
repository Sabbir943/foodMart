import mongoose from "mongoose";
import { addressSchema } from "./shared.js";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: false, default: "", trim: true },
    passwordHash: { type: String, required: false, default: null, select: false },
    role: {
      type: String,
      enum: ["customer", "vendor", "rider", "admin"],
      required: true,
      default: "customer",
    },
    isBlocked: { type: Boolean, default: false },
    addresses: [addressSchema],
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
