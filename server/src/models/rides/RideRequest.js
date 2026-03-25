import mongoose from "mongoose";

const STATUSES = ["pending", "accepted", "started", "completed", "cancelled"];

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
        values: ["bike", "car", "van"],
        message: "Vehicle type must be bike, car, or van"
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
    acceptedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
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

export default mongoose.model("RideRequest", rideRequestSchema);
