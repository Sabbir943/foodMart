import mongoose from "mongoose";

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, expiryDate: 1 });

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
