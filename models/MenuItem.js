import mongoose from "mongoose";

const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    priceModifier: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const menuItemSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true },
    variants: [variantSchema],
    isAvailable: { type: Boolean, default: true },
    category: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ restaurantId: 1 });
menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
menuItemSchema.index({ name: "text", description: "text" });

export default mongoose.models.MenuItem ||
  mongoose.model("MenuItem", menuItemSchema);
