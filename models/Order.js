import mongoose from "mongoose";
import { addressSchema } from "./shared.js";

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    variant: { type: String, trim: true },
  },
  { _id: false }
);

const statusTimestampsSchema = new Schema(
  {
    placed: Date,
    confirmed: Date,
    preparing: Date,
    out_for_delivery: Date,
    delivered: Date,
    cancelled: Date,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
    isReadyForPickup: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: addressSchema, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile_banking"],
      required: true,
    },
    statusTimestamps: {
      type: statusTimestampsSchema,
      default: () => ({ placed: new Date() }),
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ riderId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
