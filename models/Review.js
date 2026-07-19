import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
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
    restaurantRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    riderRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ orderId: 1 }, { unique: true });
reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ riderId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });

export default mongoose.models.Review || mongoose.model("Review", reviewSchema);
