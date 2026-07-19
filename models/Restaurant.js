import mongoose from "mongoose";
import { addressSchema, geoPointSchema, operatingHoursSchema } from "./shared.js";

const { Schema } = mongoose;

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    address: { type: addressSchema, required: true },
    location: {
      type: geoPointSchema,
      required: true,
    },
    operatingHours: [operatingHoursSchema],
    isApproved: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ location: "2dsphere" });
restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ category: 1 });
restaurantSchema.index({ isApproved: 1, isOpen: 1 });
restaurantSchema.index({ name: "text", description: "text" });

export default mongoose.models.Restaurant ||
  mongoose.model("Restaurant", restaurantSchema);
