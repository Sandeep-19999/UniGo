import mongoose from "mongoose";

const STATUSES = ["pending", "accepted", "started", "completed", "cancelled"];
const MATCHING_STATUSES = ["unmatched", "matched", "accepted", "expired"];
const DRIVER_JOURNEY_STEPS = [
  "awaiting_driver",
  "assigned",
  "arrived_at_pickup",
  "rider_notified",
  "trip_started",
  "dropping_off",
  "completed"
];

const pointSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  { _id: false }
);

const matchedDriverSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    availability: { type: mongoose.Schema.Types.ObjectId, ref: "DriverAvailability", default: null },
    score: { type: Number, min: 0, max: 100, default: 0 },
    pickupDistanceKm: { type: Number, min: 0, default: 0 },
    destinationDistanceKm: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending"
    },
    matchedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null }
  },
  { _id: false }
);

const rideRequestSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Passenger is required"],
      index: true
    },
    pickupLocation: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
      minlength: [3, "Pickup location must be at least 3 characters"]
    },
    dropLocation: {
      type: String,
      required: [true, "Drop location is required"],
      trim: true,
      minlength: [3, "Drop location must be at least 3 characters"]
    },
    pickupCoords: { type: pointSchema, default: null },
    dropCoords: { type: pointSchema, default: null },
    numberOfSeats: {
      type: Number,
      required: [true, "Number of seats is required"],
      min: [0, "Seats must be 0 (any) or 1 or more"],
      max: [3, "Maximum seat preference is 3+"],
      validate: {
        validator: Number.isInteger,
        message: "Number of seats must be an integer"
      }
    },
    vehicleType: {
      type: String,
      enum: {
        values: ["bike", "car", "van", "mini_van"],
        message: "Vehicle type must be bike, car, van, or mini_van"
      },
      default: "car"
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["cash", "online"],
        message: "Payment method must be cash or online"
      },
      default: "cash"
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Notes cannot exceed 300 characters"]
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "pending",
      index: true
    },
    matchingStatus: {
      type: String,
      enum: MATCHING_STATUSES,
      default: "unmatched",
      index: true
    },
    driverJourneyStep: {
      type: String,
      enum: DRIVER_JOURNEY_STEPS,
      default: "awaiting_driver",
      index: true
    },
    driverJourneyUpdatedAt: {
      type: Date,
      default: null
    },
    matchedDrivers: { type: [matchedDriverSchema], default: [] },
    rejectedByDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    acceptedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null
    },
    acceptedAt: { type: Date, default: null },
    estimatedPrice: {
      type: Number,
      default: 0
    },
    distanceKm: {
      type: Number,
      min: [0, "Distance cannot be negative"],
      default: 0
    },
    timeMin: {
      type: Number,
      min: [0, "Estimated time cannot be negative"],
      default: 0
    },
    estimatedFare: {
      type: Number,
      min: [0, "Estimated fare cannot be negative"],
      default: 0
    }
  },
  { timestamps: true }
);

rideRequestSchema.index({ createdAt: -1 });
rideRequestSchema.index({ acceptedBy: 1, status: 1 });
rideRequestSchema.index({ "matchedDrivers.driver": 1, status: 1 });

export default mongoose.model("RideRequest", rideRequestSchema);