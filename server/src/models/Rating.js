import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    rideRequest: { type: mongoose.Schema.Types.ObjectId, ref: "RideRequest", required: true, unique: true, index: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 300, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Rating", ratingSchema);
