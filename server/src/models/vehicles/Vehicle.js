import mongoose from "mongoose";

const TYPES = ["bike", "car", "van", "mini_van"];

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
    seatCapacity: { type: Number, required: true }
  },
  { timestamps: true }
);

vehicleSchema.index({ driver: 1, plateNumber: 1 }, { unique: true });

vehicleSchema.pre("validate", function (next) {
  if (!validateSeatCapacity(this.type, this.seatCapacity)) {
    return next(new Error("Invalid seat capacity for type (Bike=1, Car≤4, Van≥8, Mini Van 6–20)."));
  }
  next();
});

export default mongoose.model("Vehicle", vehicleSchema);
