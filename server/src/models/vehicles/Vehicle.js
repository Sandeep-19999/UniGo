import mongoose from "mongoose";

const TYPES = ["bike", "car", "van", "mini_van"];
const REVIEW_STATUSES = ["draft", "submitted", "approved", "rejected"];

function validateSeatCapacity(type, seatCapacity) {
  if (!Number.isFinite(seatCapacity)) return false;
  if (type === "bike") return seatCapacity === 1;
  if (type === "car") return seatCapacity >= 1 && seatCapacity <= 4;
  if (type === "van") return seatCapacity >= 8 && seatCapacity <= 60;
  if (type === "mini_van") return seatCapacity >= 6 && seatCapacity <= 20;
  return false;
}

const vehicleSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: TYPES, required: true },
    plateNumber: { type: String, required: true, trim: true },
    seatCapacity: { type: Number, required: true },

    make: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    year: {
      type: Number,
      min: 1980,
      max: new Date().getFullYear() + 1,
      default: null
    },
    color: { type: String, trim: true, default: "" },
    isPrimary: { type: Boolean, default: false },

    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: "draft" },
    reviewNote: { type: String, trim: true, default: "" },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

vehicleSchema.index({ driver: 1, plateNumber: 1 }, { unique: true });

vehicleSchema.pre("validate", function (next) {
  if (this.plateNumber) {
    this.plateNumber = String(this.plateNumber).trim().toUpperCase();
  }

  if (!validateSeatCapacity(this.type, this.seatCapacity)) {
    return next(new Error("Invalid seat capacity for type (Bike=1, Car≤4, Van≥8, Mini Van 6–20)."));
  }

  next();
});

export default mongoose.model("Vehicle", vehicleSchema);
