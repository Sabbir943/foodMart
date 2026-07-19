import mongoose from "mongoose";
import { geoPointSchema } from "./shared.js";

const { Schema } = mongoose;

const riderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["bicycle", "motorcycle", "car"],
      required: true,
    },
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
      type: geoPointSchema,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  {
    timestamps: true,
  }
);

riderSchema.index({ userId: 1 }, { unique: true });
riderSchema.index({ currentLocation: "2dsphere" });
riderSchema.index({ isAvailable: 1 });

export default mongoose.models.Rider || mongoose.model("Rider", riderSchema);
