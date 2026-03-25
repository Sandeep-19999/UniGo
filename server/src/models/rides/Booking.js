import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true, index: true },
    seatsBooked: { type: Number, required: true, min: 1, default: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "driver_accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
