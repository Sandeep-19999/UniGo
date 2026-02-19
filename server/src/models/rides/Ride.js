import mongoose from "mongoose";

const STATUSES = ["pending", "ongoing", "completed", "cancelled"];

const pointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    origin: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },

    departureTime: { type: Date, required: true },
    pricePerSeat: { type: Number, required: true, min: 0 },

    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    bookedSeats: { type: Number, required: true, min: 0, default: 0 },

    status: { type: String, enum: STATUSES, default: "pending", index: true }
  },
  { timestamps: true }
);

rideSchema.pre("validate", function (next) {
  if (this.bookedSeats > this.totalSeats) return next(new Error("bookedSeats cannot exceed totalSeats."));
  const expected = this.totalSeats - this.bookedSeats;
  if (this.availableSeats !== expected) this.availableSeats = expected;
  next();
});

export default mongoose.model("Ride", rideSchema);
