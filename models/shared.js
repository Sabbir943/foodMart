import mongoose from "mongoose";

const { Schema } = mongoose;

export const addressSchema = new Schema(
  {
    label: { type: String, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

export const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords) =>
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords[0] >= -180 &&
          coords[0] <= 180 &&
          coords[1] >= -90 &&
          coords[1] <= 90,
        message: "Coordinates must be [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

export const operatingHoursSchema = new Schema(
  {
    day: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      required: true,
    },
    open: { type: String, required: true },
    close: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);
