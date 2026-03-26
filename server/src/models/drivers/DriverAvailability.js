import mongoose from "mongoose";

const STATUSES = ["offline", "online", "matched"];
const VEHICLE_TYPES = ["bike", "car", "van", "mini_van"];

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: undefined,
      validate: {
        validator: (value) => !value || (Array.isArray(value) && value.length === 2),
        message: "Coordinates must be [lng, lat]."
      }
    }
  },
  { _id: false }
);

const driverAvailabilitySchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },
    vehicleType: {
      type: String,
      enum: VEHICLE_TYPES,
      required: true
    },
    seatsAvailable: { type: Number, min: 1, default: 1 },
    maxPickupDistanceKm: { type: Number, min: 1, max: 50, default: 8 },
    maxDestinationDistanceKm: { type: Number, min: 1, max: 50, default: 10 },
    currentLocation: { type: geoPointSchema, required: true },
    destination: { type: geoPointSchema, default: null },
    destinationLabel: { type: String, trim: true, default: "" },
    isOnline: { type: Boolean, default: false, index: true },
    status: { type: String, enum: STATUSES, default: "offline", index: true },
    notes: { type: String, trim: true, default: "" },
    lastLocationAt: { type: Date, default: Date.now },
    lastMatchedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

driverAvailabilitySchema.index({ currentLocation: "2dsphere" });
driverAvailabilitySchema.index({ destination: "2dsphere" });

export default mongoose.model("DriverAvailability", driverAvailabilitySchema);
